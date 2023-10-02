/**
 * @license
 * Copyright 2022-2023 Project CHIP Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from "assert";

import {
    AccessControl,
    AdministratorCommissioning,
    BasicInformation,
    ClusterServer,
    Descriptor,
    GeneralCommissioning,
    GeneralDiagnostics,
    Groups,
    Identify,
    NetworkCommissioning,
    OnOffCluster,
    OperationalCredentials,
    Scenes,
} from "@project-chip/matter.js/cluster";
import {
    ClusterId,
    DeviceTypeId,
    EndpointNumber,
    FabricIndex,
    GroupId,
    VendorId,
} from "@project-chip/matter.js/datatype";

import { CommissioningController, CommissioningServer, MatterServer } from "@project-chip/matter.js";
import { OnOffLightDevice } from "@project-chip/matter.js/device";
import { FabricJsonObject } from "@project-chip/matter.js/fabric";
import { DecodedEventData, InteractionClientMessenger } from "@project-chip/matter.js/interaction";
import { MdnsBroadcaster, MdnsScanner } from "@project-chip/matter.js/mdns";
import { Network, NetworkFake } from "@project-chip/matter.js/net";
import { StorageBackendMemory, StorageManager } from "@project-chip/matter.js/storage";
import { Time } from "@project-chip/matter.js/time";
import { ByteArray, createPromise, singleton } from "@project-chip/matter.js/util";
import { TimeNode } from "../src/time/TimeNode.js";

const SERVER_IPv6 = "fdce:7c65:b2dd:7d46:923f:8a53:eb6c:cafe";
//const SERVER_IPv4 = "192.168.200.1";
const SERVER_MAC = "00:B0:D0:63:C2:26";
const CLIENT_IPv6 = "fdce:7c65:b2dd:7d46:923f:8a53:eb6c:beef";
//const CLIENT_IPv4 = "192.168.200.2";
const CLIENT_MAC = "CA:FE:00:00:BE:EF";

const serverNetwork = new NetworkFake(SERVER_MAC, [SERVER_IPv6]);
const clientNetwork = new NetworkFake(CLIENT_MAC, [CLIENT_IPv6]);

const deviceName = "Matter end-to-end device";
const deviceType = DeviceTypeId(257); /* Dimmable bulb */
const vendorName = "matter-node.js";
const vendorId = VendorId(0xfff1);
const productName = "Matter end-to-end device";
const productId = 0x8001;
const longDiscriminator = 3840;
const setupPin = 20202021;
const matterPort = 5540;

const TIME_START = 1666663000000;

const fakeControllerStorage = new StorageBackendMemory();
const fakeServerStorage = new StorageBackendMemory();

// NOTE - this suite is designed to run sequentially start-to-finish; you can't
// run individual steps

describe("Integration Test", () => {
    let matterServer: MatterServer;
    let matterClient: MatterServer;
    let commissioningController: CommissioningController;
    let commissioningServer: CommissioningServer;
    let onOffLightDeviceServer: OnOffLightDevice;
    let mdnsScanner: MdnsScanner;
    let mdnsBroadcaster: MdnsBroadcaster;

    before(async () => {
        MockTime.reset(TIME_START);

        Network.get = () => clientNetwork;

        const controllerStorageManager = new StorageManager(fakeControllerStorage);
        await controllerStorageManager.initialize();

        matterClient = new MatterServer(controllerStorageManager, { disableIpv4: true });
        commissioningController = new CommissioningController({
            serverAddress: { ip: SERVER_IPv6, port: matterPort, type: "udp" },
            longDiscriminator,
            passcode: setupPin,
            listeningAddressIpv6: CLIENT_IPv6,
            delayedPairing: true,
            commissioningOptions: {
                regulatoryLocation: GeneralCommissioning.RegulatoryLocationType.Indoor,
                regulatoryCountryCode: "DE",
            },
            subscribeAllAttributes: false,
        });
        matterClient.addCommissioningController(commissioningController);

        Network.get = () => serverNetwork;

        const serverStorageManager = new StorageManager(fakeServerStorage);
        await serverStorageManager.initialize();

        // make cluster data version deterministic
        const nodeContext = serverStorageManager.createContext("0");
        const cluster16Context = nodeContext.createContext("Cluster-1-6");
        cluster16Context.set("_clusterDataVersion", 0); // Make sure the onoff attribute has deterministic start version for tests
        const cluster029Context = nodeContext.createContext("Cluster-0-29");
        cluster029Context.set("_clusterDataVersion", 0); // Make sure the serverList attribute has deterministic start version for tests
        const cluster040Context = nodeContext.createContext("Cluster-0-40");
        cluster040Context.set("_clusterDataVersion", 0); // Make sure the serverList attribute has deterministic start version for tests

        matterServer = new MatterServer(serverStorageManager, { disableIpv4: true });

        commissioningServer = new CommissioningServer({
            port: matterPort,
            listeningAddressIpv6: SERVER_IPv6,
            deviceName,
            deviceType,
            passcode: setupPin,
            discriminator: longDiscriminator,
            basicInformation: {
                vendorName,
                vendorId,
                productName,
                productId,
                partNumber: "123456",
                nodeLabel: "",
                location: "US",
                reachable: true,
            },
            delayedAnnouncement: true, // delay because we need to override Mdns classes
        });

        onOffLightDeviceServer = new OnOffLightDevice();
        commissioningServer.addDevice(onOffLightDeviceServer);

        const netCluster = NetworkCommissioning.Cluster.with(NetworkCommissioning.Feature.WiFiNetworkInterface);
        // Override NetworkCommissioning Cluster for now unless configurable
        commissioningServer.addRootClusterServer(
            ClusterServer(
                netCluster,
                {
                    maxNetworks: 1,
                    interfaceEnabled: true,
                    lastConnectErrorValue: 0,
                    lastNetworkId: ByteArray.fromHex(
                        "0000000000000000000000000000000000000000000000000000000000000000",
                    ),
                    lastNetworkingStatus: NetworkCommissioning.NetworkCommissioningStatus.Success,
                    networks: [
                        {
                            networkId: ByteArray.fromHex(
                                "0000000000000000000000000000000000000000000000000000000000000000",
                            ),
                            connected: true,
                        },
                    ],
                    scanMaxTimeSeconds: 30,
                    connectMaxTimeSeconds: 60,
                },
                {
                    scanNetworks: async function () {
                        throw new Error("Not implemented");
                    },

                    removeNetwork: async function () {
                        throw new Error("Not implemented");
                    },

                    connectNetwork: async function () {
                        throw new Error("Not implemented");
                    },

                    reorderNetwork: async function () {
                        throw new Error("Not implemented");
                    },

                    addOrUpdateWiFiNetwork: async function () {
                        throw new Error("Not implemented");
                    },
                },
            ),
        );

        matterServer.addCommissioningServer(commissioningServer);

        // override the mdns scanner to avoid the client to try to resolve the server's address
        mdnsScanner = await MdnsScanner.create({ enableIpv4: false, netInterface: SERVER_IPv6 });
        commissioningServer.setMdnsScanner(mdnsScanner);
        mdnsBroadcaster = await MdnsBroadcaster.create({ enableIpv4: false, multicastInterface: SERVER_IPv6 });
        commissioningServer.setMdnsBroadcaster(mdnsBroadcaster);
        await commissioningServer.advertise();

        assert.ok(onOffLightDeviceServer.getClusterServer(OnOffCluster));
    });

    describe("Check Server API", () => {
        it("Access cluster servers via api", async () => {
            const basicInfoCluster = commissioningServer.getRootClusterServer(BasicInformation.Cluster);
            assert.ok(basicInfoCluster);

            // check API access for a Mandatory field with both APIs, get and set
            const v1_objApi = basicInfoCluster.attributes.softwareVersionString.getLocal();
            assert.equal(v1_objApi, "v1");

            // check API access for an existing optional field with both APIs, get and set
            assert.ok(basicInfoCluster.attributes.nodeLabel);
            const nodeLabel_objApi = basicInfoCluster.attributes.nodeLabel.getLocal();
            assert.equal(nodeLabel_objApi, "");
            basicInfoCluster.attributes.nodeLabel.setLocal("234567");
            const nodeLabel_accessorApi = basicInfoCluster.getNodeLabelAttribute();
            assert.equal(nodeLabel_accessorApi, "234567");
            basicInfoCluster.setNodeLabelAttribute("345678");
            const nodeLabel_accessorApi2 = basicInfoCluster.getNodeLabelAttribute();
            assert.equal(nodeLabel_accessorApi2, "345678");

            // check API access for an optional field with both APIs
            assert.equal(basicInfoCluster.attributes.manufacturingDate, undefined);
            const manufactoringDate_accessorApi = basicInfoCluster.getManufacturingDateAttribute?.();
            assert.equal(manufactoringDate_accessorApi, undefined);
        });
    });

    describe("commission", () => {
        it("the client commissions a new device", async () => {
            // override the mdns scanner to avoid the client to try to resolve the server's address
            commissioningController.setMdnsScanner(
                await MdnsScanner.create({ enableIpv4: false, netInterface: CLIENT_IPv6 }),
            );

            // During commissioning too much magic happens, MockTime do not work in this case
            // So use normal Time implementation and Reset for the following tests
            const mockTimeInstance = Time.get();
            Time.get = singleton(() => new TimeNode());

            await commissioningController.connect();

            Time.get = () => mockTimeInstance;

            Network.get = () => {
                throw new Error("Network should not be requested post starting");
            };

            assert.ok(commissioningController.getFabric().nodeId);
        });

        it("Subscribe to all Attributes and bind updates to them", async () => {
            const data = await commissioningController.subscribeAllAttributesAndEvents(true);

            assert.equal(Array.isArray(data.attributeReports), true);
            assert.equal(Array.isArray(data.eventReports), true);
        });

        it("Verify that commissioning changed the Regulatory Config/Location values", async () => {
            const generalCommissioningCluster = commissioningController.getRootClusterClient(
                GeneralCommissioning.Cluster,
            );
            assert.equal(
                await generalCommissioningCluster?.getRegulatoryConfigAttribute(),
                GeneralCommissioning.RegulatoryLocationType.Indoor,
            );

            const basicInfoCluster = commissioningController.getRootClusterClient(BasicInformation.Cluster);
            assert.equal(await basicInfoCluster?.getLocationAttribute(), "DE");
        });
    });

    describe("Check Timed transactions", () => {
        describe("Timed Invokes", () => {
            it("Timed interaction expired", async () => {
                const adminCommissioningCluster = commissioningController.getRootClusterClient(
                    AdministratorCommissioning.Cluster,
                );
                assert.ok(adminCommissioningCluster);
                MockTime.interceptOnce(InteractionClientMessenger.prototype, "sendTimedRequest", async () =>
                    MockTime.advance(10),
                );
                const promise = adminCommissioningCluster.openCommissioningWindow(
                    {
                        salt: new ByteArray(32),
                        commissioningTimeout: 10,
                        discriminator: 0,
                        iterations: 1000,
                        pakePasscodeVerifier: new ByteArray(97),
                    },
                    { timedRequestTimeoutMs: 1 },
                );
                await assert.rejects(async () => await promise, {
                    message: "(148) Received error status: 148", // Timeout expired
                });
            });

            it("Custom timed interaction with short timeout expired", async () => {
                const onoffEndpoint = commissioningController.getDevices().find(endpoint => endpoint.id === 1);
                assert.ok(onoffEndpoint);
                const onoffCluster = onoffEndpoint.getClusterClient(OnOffCluster);
                assert.ok(onoffCluster);

                MockTime.interceptOnce(InteractionClientMessenger.prototype, "sendTimedRequest", async () =>
                    MockTime.advance(10),
                );
                const promise = onoffCluster.toggle(undefined, { timedRequestTimeoutMs: 1 });
                await assert.rejects(async () => await promise, {
                    message: "(148) Received error status: 148", // Timeout expired
                });
            });

            it("Custom timed interaction with default timeout works", async () => {
                const onoffEndpoint = commissioningController.getDevices().find(endpoint => endpoint.id === 1);
                assert.ok(onoffEndpoint);
                const onoffCluster = onoffEndpoint.getClusterClient(OnOffCluster);
                assert.ok(onoffCluster);

                MockTime.interceptOnce(InteractionClientMessenger.prototype, "sendTimedRequest", async () =>
                    MockTime.advance(5000),
                );
                await onoffCluster.off(undefined, { asTimedRequest: true });
            });

            it("Timed invoke ok", async () => {
                const adminCommissioningCluster = commissioningController.getRootClusterClient(
                    AdministratorCommissioning.Cluster,
                );
                assert.ok(adminCommissioningCluster);
                await adminCommissioningCluster.openCommissioningWindow(
                    {
                        salt: new ByteArray(32),
                        commissioningTimeout: 180,
                        discriminator: 0,
                        iterations: 1000,
                        pakePasscodeVerifier: new ByteArray(97),
                    },
                    { timedRequestTimeoutMs: 5000 },
                );
            });
        });
    });

    describe("read attributes", () => {
        it("read one specific attribute including schema parsing", async () => {
            const basicInfoCluster = commissioningController.getRootClusterClient(BasicInformation.Cluster);
            assert.ok(basicInfoCluster);

            // Access a Mandatory field with both APIs
            const v1_objApi = await basicInfoCluster.attributes.softwareVersionString.get();
            assert.equal(v1_objApi, "v1");
            const v1_accessorApi = await basicInfoCluster.getSoftwareVersionStringAttribute();
            assert.equal(v1_accessorApi, "v1");

            // Access an existing optional field with both APIs
            const partNumber_objApi = await basicInfoCluster.attributes.partNumber.get();
            assert.equal(partNumber_objApi, "123456");
            const partNumber_accessorApi = await basicInfoCluster.getPartNumberAttribute();
            assert.equal(partNumber_accessorApi, "123456");

            // Access an not existing optional field with both APIs
            const manufactoringDate_objApi = await basicInfoCluster.attributes.manufacturingDate.get();
            assert.equal(manufactoringDate_objApi, undefined);
            const manufactoringDate_accessorApi = await basicInfoCluster.getManufacturingDateAttribute();
            assert.equal(manufactoringDate_accessorApi, undefined);
        });

        it("read one specific attribute including schema parsing", async () => {
            const onoffEndpoint = commissioningController.getDevices().find(endpoint => endpoint.id === 1);
            assert.ok(onoffEndpoint);
            const onoffCluster = onoffEndpoint.getClusterClient(OnOffCluster);
            assert.ok(onoffCluster);

            assert.equal(await onoffCluster.attributes.onOff.get(), false);
        });

        it("read all attributes and events", async () => {
            const response = await commissioningController.getInteractionClient().getAllAttributesAndEvents();
            assert.ok(response);
            assert.ok(response.attributeReports.length);
            assert.ok(response.eventReports.length);
        });

        it("read multiple attributes", async () => {
            const response = await commissioningController.getInteractionClient().getMultipleAttributes({
                attributes: [
                    { clusterId: Descriptor.Cluster.id }, // * /DescriptorCluster/ *
                    { endpointId: EndpointNumber(0), clusterId: BasicInformation.Cluster.id }, // 0/BasicInformationCluster/ *
                    {
                        endpointId: EndpointNumber(1),
                        clusterId: OnOffCluster.id,
                        attributeId: OnOffCluster.attributes.onOff.id,
                    }, // 1/OnOffCluster/onOff
                    { endpointId: EndpointNumber(2) }, // 2 / * /* - will be discarded in results!
                ],
            });

            assert.equal(response.length, 43);
            assert.equal(
                response.filter(
                    ({ path: { endpointId, clusterId } }) => endpointId === 0 && clusterId === Descriptor.Cluster.id,
                ).length,
                10,
            );
            assert.equal(
                response.filter(
                    ({ path: { endpointId, clusterId } }) => endpointId === 1 && clusterId === Descriptor.Cluster.id,
                ).length,
                10,
            );

            const descriptorServerListData = response.find(
                ({ path: { endpointId, clusterId, attributeId } }) =>
                    endpointId === 0 &&
                    clusterId === Descriptor.Cluster.id &&
                    attributeId === Descriptor.Cluster.attributes.serverList.id,
            );
            assert.deepEqual(descriptorServerListData, {
                path: {
                    nodeId: undefined,
                    endpointId: 0,
                    clusterId: Descriptor.Cluster.id,
                    attributeId: Descriptor.Cluster.attributes.serverList.id,
                    attributeName: "serverList",
                },
                value: [
                    ClusterId(29),
                    ClusterId(31),
                    ClusterId(40),
                    ClusterId(48),
                    ClusterId(49),
                    ClusterId(51),
                    ClusterId(60),
                    ClusterId(62),
                    ClusterId(63),
                ],
                version: 0,
            });

            assert.equal(
                response.filter(
                    ({ path: { endpointId, clusterId } }) =>
                        endpointId === 0 && clusterId === BasicInformation.Cluster.id,
                ).length,
                22,
            );
            const softwareVersionStringData = response.find(
                ({ path: { endpointId, clusterId, attributeId } }) =>
                    endpointId === 0 &&
                    clusterId === BasicInformation.Cluster.id &&
                    attributeId === BasicInformation.Cluster.attributes.softwareVersionString.id,
            );
            assert.deepEqual(softwareVersionStringData, {
                path: {
                    nodeId: undefined,
                    endpointId: 0,
                    clusterId: BasicInformation.Cluster.id,
                    attributeId: BasicInformation.Cluster.attributes.softwareVersionString.id,
                    attributeName: "softwareVersionString",
                },
                value: "v1",
                version: 3,
            });
            const nodeLabelData = response.find(
                ({ path: { endpointId, clusterId, attributeId } }) =>
                    endpointId === 0 &&
                    clusterId === BasicInformation.Cluster.id &&
                    attributeId === BasicInformation.Cluster.attributes.nodeLabel.id,
            );
            assert.deepEqual(nodeLabelData, {
                path: {
                    nodeId: undefined,
                    endpointId: 0,
                    clusterId: BasicInformation.Cluster.id,
                    attributeId: BasicInformation.Cluster.attributes.nodeLabel.id,
                    attributeName: "nodeLabel",
                },
                value: "345678",
                version: 3,
            });

            const onOffData = response.find(
                ({ path: { endpointId, clusterId, attributeId } }) =>
                    endpointId === 1 &&
                    clusterId === OnOffCluster.id &&
                    attributeId === OnOffCluster.attributes.onOff.id,
            );
            assert.deepEqual(onOffData, {
                path: {
                    nodeId: undefined,
                    endpointId: 1,
                    clusterId: OnOffCluster.id,
                    attributeId: OnOffCluster.attributes.onOff.id,
                    attributeName: "onOff",
                },
                value: false,
                version: 0,
            });
        });

        it("read events", async () => {
            const response = await commissioningController.getInteractionClient().getMultipleEvents({
                events: [
                    { clusterId: BasicInformation.Cluster.id }, // * /BasicInformationCluster/ *
                    {
                        endpointId: EndpointNumber(0),
                        clusterId: GeneralDiagnostics.Cluster.id,
                        eventId: GeneralDiagnostics.Cluster.events.bootReason.id,
                    }, // 0/GeneralDiagnosticsCluster/bootReason
                    { endpointId: EndpointNumber(2) }, // 2 / * /* - will be discarded in results!
                ],
            });

            assert.equal(response.length, 2);
            assert.equal(
                response.filter(
                    ({ path: { endpointId, clusterId } }) =>
                        endpointId === 0 && clusterId === BasicInformation.Cluster.id,
                ).length,
                1,
            );

            const startUpEventData = response.find(
                ({ path: { endpointId, clusterId, eventId } }) =>
                    endpointId === 0 &&
                    clusterId === BasicInformation.Cluster.id &&
                    eventId === BasicInformation.Cluster.events.startUp.id,
            );

            assert.deepEqual(startUpEventData?.events, [
                {
                    eventNumber: 1,
                    epochTimestamp: TIME_START,
                    priority: BasicInformation.Cluster.events.startUp.priority,
                    data: {
                        softwareVersion: 1,
                    },
                    path: undefined,
                },
            ]);

            const bootReasonEventData = response.find(
                ({ path: { endpointId, clusterId, eventId } }) =>
                    endpointId === 0 &&
                    clusterId === GeneralDiagnostics.Cluster.id &&
                    eventId === GeneralDiagnostics.Cluster.events.bootReason.id,
            );
            assert.deepEqual(bootReasonEventData?.events, [
                {
                    eventNumber: 2,
                    epochTimestamp: TIME_START,
                    priority: BasicInformation.Cluster.events.startUp.priority,
                    data: {
                        bootReason: GeneralDiagnostics.BootReason.Unspecified,
                    },
                    path: undefined,
                },
            ]);
        });
    });

    describe("write attributes", () => {
        it("write one attribute", async () => {
            const basicInfoCluster = commissioningController.getRootClusterClient(BasicInformation.Cluster);
            assert.ok(basicInfoCluster);

            await basicInfoCluster.attributes.nodeLabel.set("testLabel");

            // Local value because not yet updated from subscription
            assert.equal(await basicInfoCluster.attributes.nodeLabel.get(), "345678");
            // Request remotely
            assert.equal(await basicInfoCluster.attributes.nodeLabel.get(true), "testLabel");

            // Await initial Data
            const { promise, resolver } = createPromise<string>();
            const callback = (value: string) => resolver(value);

            basicInfoCluster.attributes.nodeLabel.addListener(callback);

            await MockTime.advance(60);
            await MockTime.advance(60);
            await promise;

            // Local value because not yet updated from subscription
            assert.equal(await basicInfoCluster.attributes.nodeLabel.get(), "testLabel");
        });

        it("write one attribute with error", async () => {
            const basicInfoCluster = commissioningController.getRootClusterClient(BasicInformation.Cluster);
            assert.ok(basicInfoCluster);

            await assert.rejects(async () => await basicInfoCluster.attributes.location.set("XXX"), {
                message: "String is too long: 3, max 2.",
            });
        });

        it("write multiple attributes", async () => {
            const client = commissioningController.getInteractionClient(); // We can also use a new Interaction clint

            const response = await client.setMultipleAttributes({
                attributes: [
                    {
                        endpointId: EndpointNumber(0),
                        clusterId: BasicInformation.Cluster.id,
                        attribute: BasicInformation.Cluster.attributes.nodeLabel,
                        value: "testLabel2",
                    },
                    {
                        endpointId: EndpointNumber(0),
                        clusterId: BasicInformation.Cluster.id,
                        attribute: BasicInformation.Cluster.attributes.location,
                        value: "GB",
                    },
                ],
            });

            assert.equal(Array.isArray(response), true);
            assert.equal(response.length, 0);

            const basicInfoCluster = commissioningController.getRootClusterClient(BasicInformation.Cluster);
            assert.ok(basicInfoCluster);
            assert.equal(await basicInfoCluster.attributes.nodeLabel.get(true), "testLabel2");
            assert.equal(await basicInfoCluster.getLocationAttribute(true), "GB");
        });

        it("write multiple attributes with partial errors", async () => {
            const response = await commissioningController.getInteractionClient().setMultipleAttributes({
                attributes: [
                    {
                        endpointId: EndpointNumber(0),
                        clusterId: BasicInformation.Cluster.id,
                        attribute: BasicInformation.Cluster.attributes.nodeLabel,
                        value: "testLabel3",
                    },
                    {
                        endpointId: EndpointNumber(0),
                        clusterId: BasicInformation.Cluster.id,
                        attribute: BasicInformation.Cluster.attributes.location,
                        value: "XXX",
                    },
                ],
            });

            assert.equal(response.length, 1);
            assert.equal(response[0].path.attributeId, BasicInformation.Cluster.attributes.location.id);
            assert.equal(response[0].status, 135 /* StatusCode.ConstraintError */);

            const basicInfoCluster = commissioningController.getRootClusterClient(BasicInformation.Cluster);
            assert.ok(basicInfoCluster);

            assert.equal(await basicInfoCluster.attributes.nodeLabel.get(true), "testLabel3");
            assert.equal(await basicInfoCluster.attributes.location.get(true), "GB");
        });

        it("write multiple attributes with partial errors and suppressed response", async () => {
            const response = await commissioningController.getInteractionClient().setMultipleAttributes({
                attributes: [
                    {
                        endpointId: EndpointNumber(0),
                        clusterId: BasicInformation.Cluster.id,
                        attribute: BasicInformation.Cluster.attributes.nodeLabel,
                        value: "testLabel4",
                    },
                    {
                        endpointId: EndpointNumber(0),
                        clusterId: BasicInformation.Cluster.id,
                        attribute: BasicInformation.Cluster.attributes.location,
                        value: "XXX",
                    },
                ],
                suppressResponse: true,
            });

            assert.equal(response.length, 0);

            const basicInfoCluster = commissioningController.getRootClusterClient(BasicInformation.Cluster);
            assert.ok(basicInfoCluster);

            assert.equal(await basicInfoCluster.attributes.nodeLabel.get(true), "testLabel4");
            assert.equal(await basicInfoCluster.attributes.location.get(true), "GB");
        });
    });

    describe("Groups server fabric scoped storage", () => {
        it("add a group", async () => {
            const onoffEndpoint = commissioningController.getDevices().find(endpoint => endpoint.id === 1);
            assert.ok(onoffEndpoint);
            const groupsCluster = onoffEndpoint.getClusterClient(Groups.Cluster);
            assert.ok(groupsCluster);
            await groupsCluster.commands.addGroup({ groupId: GroupId(1), groupName: "Group 1" });
        });
    });

    describe("subscriptions", () => {
        it("additional subscription of one attribute sends updates when the value changes", async () => {
            assert.ok(onOffLightDeviceServer);
            const startTime = Time.nowMs();

            // Await initial Data
            const { promise: firstPromise, resolver: firstResolver } = createPromise<{
                value: boolean;
                time: number;
            }>();
            let callback = (value: boolean) => firstResolver({ value, time: Time.nowMs() });

            await commissioningController.getInteractionClient().subscribeAttribute({
                endpointId: EndpointNumber(1),
                clusterId: OnOffCluster.id,
                attribute: OnOffCluster.attributes.onOff,
                minIntervalFloorSeconds: 0,
                maxIntervalCeilingSeconds: 5,
                listener: value => callback(value),
            });

            const firstReport = await firstPromise;
            assert.deepEqual(firstReport, { value: false, time: startTime });

            // Await update Report on value change
            const { promise: updatePromise, resolver: updateResolver } = createPromise<{
                value: boolean;
                time: number;
            }>();
            callback = (value: boolean) => updateResolver({ value, time: Time.nowMs() });

            await MockTime.advance(2 * 1000);
            onOffLightDeviceServer.setOnOff(true);
            await MockTime.advance(100);
            const updateReport = await updatePromise;

            assert.deepEqual(updateReport, { value: true, time: startTime + 2 * 1000 + 100 });

            // Await update Report on value change without in between update
            const { promise: lastPromise, resolver: lastResolver } = createPromise<{
                value: boolean;
                time: number;
            }>();
            callback = (value: boolean) => lastResolver({ value, time: Time.nowMs() });

            // Verify that no update comes in after doubled max interval requested
            await MockTime.advance(10 * 1000);

            // ... but on next change immediately (means immediately + 50ms, so wait 100ms) then
            onOffLightDeviceServer.setOnOff(false);
            await MockTime.advance(100);
            const lastReport = await lastPromise;

            assert.deepEqual(lastReport, { value: false, time: startTime + (10 + 2) * 1000 + 200 });
        });

        it("another additional subscription of one attribute with known data version only sends updates when the value changes", async () => {
            const onoffEndpoint = commissioningController.getDevices().find(endpoint => endpoint.id === 1);
            assert.ok(onoffEndpoint);
            const onOffClient = onoffEndpoint.getClusterClient(OnOffCluster);
            assert.ok(onOffClient);

            assert.ok(onOffLightDeviceServer);
            const startTime = Time.nowMs();

            const pushedUpdates = Array<{
                value: boolean;
                time: number;
            }>();

            const { promise: updatePromise, resolver: updateResolver } = createPromise<void>();

            await onOffClient.subscribeOnOffAttribute(
                value => {
                    pushedUpdates.push({ value, time: Time.nowMs() });
                    updateResolver();
                },
                0,
                5,
                2,
            );

            assert.deepEqual(pushedUpdates, []);

            await MockTime.advance(2 * 1000);
            onOffLightDeviceServer.setOnOff(true);
            await MockTime.advance(100);

            await updatePromise;

            assert.deepEqual(pushedUpdates, [{ value: true, time: startTime + 2 * 1000 + 100 }]);
        });

        it("one more subscribe an attribute with getter that needs endpoint", async () => {
            const onoffEndpoint = commissioningController.getDevices().find(endpoint => endpoint.id === 1);
            assert.ok(onoffEndpoint);
            const scenesClient = onoffEndpoint.getClusterClient(Scenes.Cluster);
            assert.ok(scenesClient);

            const scenesServer = onOffLightDeviceServer.getClusterServer(Scenes.Cluster);
            assert.ok(scenesServer);

            const startTime = Time.nowMs();

            // Await initial Data
            const { promise: firstPromise, resolver: firstResolver } = createPromise<{
                value: number;
                time: number;
            }>();
            let callback = (value: number) => firstResolver({ value, time: Time.nowMs() });

            //onOffClient.attributes.onOff.addValueSetListener(value => callback(value));
            //await onOffClient.attributes.onOff.subscribe(0, 5);
            await scenesClient.subscribeSceneCountAttribute(value => callback(value), 0, 5);

            const firstReport = await firstPromise;
            assert.deepEqual(firstReport, { value: 0, time: startTime });

            // Await update Report on value change
            const { promise: updatePromise, resolver: updateResolver } = createPromise<{
                value: number;
                time: number;
            }>();
            callback = (value: number) => updateResolver({ value, time: Time.nowMs() });

            await MockTime.advance(2 * 1000);
            await scenesClient.addScene({
                groupId: GroupId(1),
                sceneId: 1,
                transitionTime: 0,
                sceneName: "Test",
                extensionFieldSets: [],
            });
            await MockTime.advance(100);
            const updateReport = await updatePromise;

            assert.deepEqual(updateReport, { value: 1, time: startTime + 2 * 1000 + 100 });
        });

        it("subscription of one event sends updates when event got triggered via auto-wiring", async () => {
            const basicInformationClient = commissioningController.getRootClusterClient(BasicInformation.Cluster);
            assert.ok(basicInformationClient);

            const basicInformationServer = commissioningServer.getRootClusterServer(BasicInformation.Cluster);
            assert.ok(basicInformationServer);
            basicInformationServer.setReachableAttribute(false);

            const startTime = Time.nowMs();

            // Await initial Data
            const { promise: firstPromise, resolver: firstResolver } = createPromise<{
                value: DecodedEventData<any>;
                time: number;
            }>();
            let callback = (value: DecodedEventData<any>) => firstResolver({ value, time: Time.nowMs() });

            await basicInformationClient.subscribeReachableChangedEvent(event => callback(event), 0, 5, true);

            await MockTime.advance(0);
            const firstReport = await firstPromise;
            assert.deepEqual(firstReport, {
                value: {
                    eventNumber: 3,
                    priority: 1,
                    epochTimestamp: BigInt(startTime),
                    data: {
                        reachableNewValue: false,
                    },
                    path: undefined,
                },
                time: startTime,
            });

            // Await update Report on value change
            const { promise: updatePromise, resolver: updateResolver } = createPromise<{
                value: DecodedEventData<any>;
                time: number;
            }>();
            callback = (value: DecodedEventData<any>) => updateResolver({ value, time: Time.nowMs() });

            await MockTime.advance(2 * 1000);
            basicInformationServer.setReachableAttribute(true);
            await MockTime.advance(100);
            const updateReport = await updatePromise;

            assert.deepEqual(updateReport, {
                value: {
                    eventNumber: 4,
                    priority: 1,
                    epochTimestamp: BigInt(startTime + 2 * 1000), // Triggered directly
                    data: {
                        reachableNewValue: true,
                    },
                    path: undefined,
                },
                time: startTime + 2 * 1000 + 100,
            });
        });
    });

    describe("Access Control server fabric scoped attribute storage", () => {
        it("set empty acl", async () => {
            const accessControlCluster = commissioningController.getRootClusterClient(AccessControl.Cluster);
            assert.ok(accessControlCluster);
            await accessControlCluster.attributes.acl.set([]);
            await accessControlCluster.setAclAttribute([]);

            const acl = await accessControlCluster.attributes.acl.get();
            const acl2 = await accessControlCluster.getAclAttribute();

            assert.ok(Array.isArray(acl));
            assert.ok(Array.isArray(acl2));
            assert.equal(acl.length, 0);
            assert.equal(acl2.length, 0);
        });
    });

    describe("Command Handler test", () => {
        it("Trigger identify command and trigger command handler", async () => {
            const onoffEndpoint = commissioningController.getDevices().find(endpoint => endpoint.id === 1);
            assert.ok(onoffEndpoint);
            const identifyClient = onoffEndpoint.getClusterClient(Identify.Cluster);
            assert.ok(identifyClient);

            const { promise: firstPromise, resolver: firstResolver } = createPromise<number>();
            onOffLightDeviceServer.addCommandHandler("identify", async ({ request: { identifyTime } }) =>
                firstResolver(identifyTime),
            );

            await identifyClient.commands.identify({ identifyTime: 5 });

            const result = await firstPromise;
            assert.equal(result, 5);
        });
    });

    describe("storage", () => {
        it("server storage has fabric fields stored correctly stringified", async () => {
            const storedFabrics = fakeServerStorage.get(["0", "FabricManager"], "fabrics");
            assert.ok(Array.isArray(storedFabrics));
            assert.equal(storedFabrics.length, 1);
            const firstFabric = storedFabrics[0] as FabricJsonObject;
            assert.equal(typeof firstFabric, "object");
            assert.equal(firstFabric.fabricIndex, 1);
            assert.equal(firstFabric.fabricId, 1);

            const groupsClusterEndpointMap = firstFabric.scopedClusterData.get(Groups.Cluster.id);
            assert.ok(groupsClusterEndpointMap);
            assert.equal(groupsClusterEndpointMap.size, 1);
            const groupsClusterData = groupsClusterEndpointMap.get("1");
            assert.ok(groupsClusterData instanceof Map);
            assert.equal(groupsClusterData.get(1), "Group 1");

            assert.equal(fakeServerStorage.get(["0", "FabricManager"], "nextFabricIndex"), 2);

            const onOffValue = fakeServerStorage.get<any>(["0", "Cluster-1-6"], "onOff");
            assert.equal(onOffValue, true);

            const onOffClusterDataVerison = fakeServerStorage.get<any>(["0", "Cluster-1-6"], "_clusterDataVersion");
            assert.equal(onOffClusterDataVerison, 3);

            const storedServerResumptionRecords = fakeServerStorage.get(["0", "SessionManager"], "resumptionRecords");
            assert.ok(Array.isArray(storedServerResumptionRecords));
            assert.equal(storedServerResumptionRecords.length, 1);

            assert.equal(fakeControllerStorage.get(["0", "RootCertificateManager"], "rootCertId"), BigInt(0));
            assert.equal(fakeControllerStorage.get(["0", "MatterController"], "fabricCommissioned"), true);

            const storedControllerResumptionRecords = fakeServerStorage.get(
                ["0", "SessionManager"],
                "resumptionRecords",
            );
            assert.ok(Array.isArray(storedControllerResumptionRecords));
            assert.equal(storedControllerResumptionRecords.length, 1);

            const storedControllerFabrics = fakeControllerStorage.get(["0", "MatterController"], "fabric");
            assert.ok(typeof storedControllerFabrics === "object");
        });
    });

    describe("remove Fabric", () => {
        it("try to remove invalid fabric", async () => {
            const operationalCredentialsCluster = commissioningController.getRootClusterClient(
                OperationalCredentials.Cluster,
            );
            assert.ok(operationalCredentialsCluster);

            const result = await operationalCredentialsCluster.commands.removeFabric({ fabricIndex: FabricIndex(250) });
            assert.equal(result.statusCode, OperationalCredentials.NodeOperationalCertStatus.InvalidFabricIndex);
            assert.equal(result.fabricIndex, undefined);
            assert.equal(result.debugText, "Fabric 250 not found");
        });

        it("read and remove fabric", async () => {
            const operationalCredentialsCluster = commissioningController.getRootClusterClient(
                OperationalCredentials.Cluster,
            );
            assert.ok(operationalCredentialsCluster);

            const fabricIndex = await operationalCredentialsCluster.attributes.currentFabricIndex.get();
            assert.ok(fabricIndex);
            assert.equal(fabricIndex, 1);

            const result = await operationalCredentialsCluster.commands.removeFabric({ fabricIndex });
            assert.equal(result.statusCode, OperationalCredentials.NodeOperationalCertStatus.Ok);
            assert.deepEqual(result.fabricIndex, fabricIndex);
        });
    });

    after(async () => {
        const promise = mdnsBroadcaster.expireAllAnnouncements(matterPort);

        await MockTime.yield();
        await MockTime.yield();
        await MockTime.yield();
        await MockTime.yield();
        await MockTime.advance(150);
        await MockTime.advance(150);
        await MockTime.yield();

        await MockTime.yield();
        await MockTime.yield();
        await MockTime.yield();
        await MockTime.yield();
        await MockTime.advance(150);
        await MockTime.advance(150);
        await MockTime.yield();

        await promise;

        await matterServer.close();
        await matterClient.close();
        await fakeControllerStorage.close();
        await fakeServerStorage.close();
    });
});

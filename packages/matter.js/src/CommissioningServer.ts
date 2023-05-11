/**
 * @license
 * Copyright 2022 The matter.js Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MatterNode } from "./MatterNode.js";
import { CommissionningFlowType, DiscoveryCapabilitiesSchema, ManualPairingCodeCodec, QrPairingCodeCodec } from "./schema/PairingCodeSchema.js";
import { ClusterServer, InteractionServer } from "./protocol/interaction/InteractionServer.js";
import { AdminCommissioningHandler } from "./cluster/server/AdminCommissioningServer.js";
import { SecureChannelProtocol } from "./protocol/securechannel/SecureChannelProtocol.js";
import { PaseServer } from "./session/pase/PaseServer.js";
import { Crypto } from "./crypto/Crypto.js";
import { CaseServer } from "./session/case/CaseServer.js";
import { MatterDevice } from "./MatterDevice.js";
import { UdpInterface } from "./net/UdpInterface.js";
import { MdnsScanner } from "./mdns/MdnsScanner.js";
import { MdnsBroadcaster } from "./mdns/MdnsBroadcaster.js";
import { StorageManager } from "./storage/StorageManager.js";
import {
    AttributeInitialValues,
    ClusterServerHandlers,
    ClusterServerObj,
    CommandHandler
} from "./cluster/server/ClusterServer.js";
import { OperationalCredentialsClusterHandler, OperationalCredentialsServerConf } from "./cluster/server/OperationalCredentialsServer.js";
import { AttestationCertificateManager } from "./certificate/AttestationCertificateManager.js";
import { CertificationDeclarationManager } from "./certificate/CertificationDeclarationManager.js";
import { GeneralCommissioningClusterHandler } from "./cluster/server/GeneralCommissioningServer.js";
import { NetworkCommissioningHandler } from "./cluster/server/NetworkCommissioningServer.js";
import { AccessControlCluster } from "./cluster/AccessControlCluster.js";
import { GroupKeyManagementCluster } from "./cluster/GroupKeyManagementCluster.js";
import { BootReason, GeneralDiagnosticsCluster } from "./cluster/GeneralDiagnosticsCluster.js";
import { VendorId } from "./datatype/VendorId.js";
import { BasicInformationCluster } from "./cluster/BasicInformationCluster.js";
import { OperationalCredentialsCluster } from "./cluster/OperationalCredentialsCluster.js";
import { FabricIndex } from "./datatype/FabricIndex.js";
import { GeneralCommissioningCluster, RegulatoryLocationType } from "./cluster/GeneralCommissioningCluster.js";
import { EthernetNetworkCommissioningCluster, NetworkCommissioningStatus } from "./cluster/NetworkCommissioningCluster.js";
import { AdminCommissioningCluster, CommissioningWindowStatus } from "./cluster/AdminCommissioningCluster.js";
import { GroupKeyManagementClusterHandler } from "./cluster/server/GroupKeyManagementServer.js";
import { QrCode } from "./schema/QrCodeSchema.js";
import { ComposedDevice } from "./device/ComposedDevice.js";
import { Device } from "./device/Device.js";
import { ByteArray } from "./util/ByteArray.js";
import { NamedHandler } from "./util/NamedHandler.js";
import { Attributes, Commands } from "./cluster/Cluster.js";

/**
 * Represents device pairing information.
 */
export interface DevicePairingInformation {
    manualPairingCode: string;
    qrPairingCode: string;
    qrCode: string;
}

/**
 * Constructor options for a CommissioningServer device
 * Beside the general options it also contains the data for the BasicInformation cluster which is added automatically
 * and allows to override the certificates used for the OperationalCredentials cluster
 */
export interface CommissioningServerOptions {
    port: number;
    disableIpv4?: boolean;
    listeningAddressIpv4?: string;
    listeningAddressIpv6?: string;
    deviceName: string;
    deviceType: number,
    nextEndpointId?: number,

    passcode: number,
    discriminator: number,
    flowType?: CommissionningFlowType,

    delayedAnnouncement?: boolean;

    basicInformation:
    | {
        vendorId: VendorId;
        vendorName: string;
        productId: number;
        productName: string;
    }
    | AttributeInitialValues<typeof BasicInformationCluster.attributes>;
    certificates?: OperationalCredentialsServerConf;
}

/**
 * Commands exposed by the CommissioningServer
 */
type CommissioningServerCommands = {
    /** Provide a means for certification tests to trigger some test-plan-specific events. */
    testEventTrigger: CommandHandler<typeof GeneralDiagnosticsCluster.commands.testEventTrigger, any>;
}

// TODO decline using set/getRootClusterClient
// TODO Decline cluster access after announced/paired

/**
 * A CommissioningServer node represent a matter node that can be paired with a controller and runs on a defined port on the
 * host
 */
export class CommissioningServer extends MatterNode {
    private readonly port: number;
    private readonly disableIpv4: boolean;
    private readonly listeningAddressIpv4?: string;
    private readonly listeningAddressIpv6?: string;
    private readonly deviceName: string;
    private readonly deviceType: number;
    private readonly passcode: number;
    private readonly discriminator: number;
    private readonly flowType: CommissionningFlowType;

    private storageManager?: StorageManager;
    private mdnsScanner?: MdnsScanner;
    private mdnsBroadcaster?: MdnsBroadcaster;

    private deviceInstance?: MatterDevice;
    private interactionServer?: InteractionServer;

    private nextEndpointId: number;

    readonly delayedAnnouncement?: boolean;

    private readonly commandHandler = new NamedHandler<CommissioningServerCommands>();

    /**
     * Creates a new CommissioningServer node and add all needed Root clusters
     *
     * @param options The options for the CommissioningServer node
     */
    constructor(options: CommissioningServerOptions) {
        super();
        this.port = options.port;
        this.disableIpv4 = options.disableIpv4 ?? false;
        this.listeningAddressIpv4 = options.listeningAddressIpv4;
        this.listeningAddressIpv6 = options.listeningAddressIpv6;
        this.deviceName = options.deviceName;
        this.deviceType = options.deviceType;
        this.passcode = options.passcode;
        this.discriminator = options.discriminator;
        this.flowType = options.flowType ?? CommissionningFlowType.Standard;
        this.nextEndpointId = options.nextEndpointId ?? 1;
        this.delayedAnnouncement = options.delayedAnnouncement ?? false;

        const {
            basicInformation: { vendorId, productId }
        } = options;

        // Add basic Information cluster to root directly because it is not allowed to be changed afterward
        this.rootEndpoint.addClusterServer(
            ClusterServer(
                BasicInformationCluster,
                // Set the required basicInformation and respect the provided values
                Object.assign(
                    {
                        dataModelRevision: 1,
                        nodeLabel: "",
                        hardwareVersion: 0,
                        hardwareVersionString: "0",
                        location: "US",
                        localConfigDisabled: false,
                        softwareVersion: 1,
                        softwareVersionString: "v1",
                        capabilityMinima: {
                            caseSessionsPerFabric: 3,
                            subscriptionsPerFabric: 3
                        },
                        serialNumber: `node-matter-${Crypto.get().getRandomData(4).toHex()}`
                    },
                    options.basicInformation
                ),
                {}
            )
        );

        // Use provided certificates for OperationalCredentialsCluster or generate own ones
        let certificates = options.certificates;
        if (certificates == undefined) {
            const paa = new AttestationCertificateManager(vendorId);
            const { keyPair: dacKeyPair, dac } = paa.getDACert(productId);
            const certificationDeclaration = CertificationDeclarationManager.generate(vendorId, productId);

            certificates = {
                devicePrivateKey: dacKeyPair.privateKey,
                deviceCertificate: dac,
                deviceIntermediateCertificate: paa.getPAICert(),
                certificationDeclaration
            };
        }

        // Add Operational credentials cluster to root directly because it is not allowed to be changed afterward
        this.rootEndpoint.addClusterServer(
            ClusterServer(
                OperationalCredentialsCluster,
                {
                    nocs: [],
                    fabrics: [],
                    supportedFabrics: 254,
                    commissionedFabrics: 0,
                    trustedRootCertificates: [],
                    currentFabricIndex: FabricIndex.NO_FABRIC
                },
                OperationalCredentialsClusterHandler(certificates)
            )
        );

        this.rootEndpoint.addClusterServer(
            ClusterServer(
                GeneralCommissioningCluster,
                {
                    breadcrumb: BigInt(0),
                    basicCommissioningInfo: {
                        failSafeExpiryLengthSeconds: 60 /* 1min */,
                        maxCumulativeFailsafeSeconds: 900 /* Recommended according to Specs */
                    },
                    regulatoryConfig: RegulatoryLocationType.Indoor,
                    locationCapability: RegulatoryLocationType.IndoorOutdoor,
                    supportsConcurrentConnections: true
                },
                GeneralCommissioningClusterHandler
            )
        );

        this.rootEndpoint.addClusterServer(
            ClusterServer(
                EthernetNetworkCommissioningCluster,
                {
                    maxNetworks: 1,
                    interfaceEnabled: true,
                    lastConnectErrorValue: 0,
                    lastNetworkId: ByteArray.fromHex("0000000000000000000000000000000000000000000000000000000000000000"),
                    lastNetworkingStatus: NetworkCommissioningStatus.Success,
                    networks: [{ networkId: ByteArray.fromHex("0000000000000000000000000000000000000000000000000000000000000000"), connected: true }],
                },
                NetworkCommissioningHandler()
            )
        );

        this.rootEndpoint.addClusterServer(
            ClusterServer(
                AccessControlCluster,
                {
                    acl: [],
                    extension: [],
                    subjectsPerAccessControlEntry: 4,
                    targetsPerAccessControlEntry: 4,
                    accessControlEntriesPerFabric: 4,
                },
                {}
            )
        );

        this.rootEndpoint.addClusterServer(
            ClusterServer(
                GroupKeyManagementCluster,
                {
                    groupKeyMap: [],
                    groupTable: [],
                    maxGroupsPerFabric: 254,
                    maxGroupKeysPerFabric: 254,
                },
                GroupKeyManagementClusterHandler()
            )
        );

        this.rootEndpoint.addClusterServer(
            ClusterServer(
                GeneralDiagnosticsCluster,
                {
                    networkInterfaces: [],
                    rebootCount: 0,
                    upTime: 0,
                    totalOperationalHours: 0,
                    bootReason: BootReason.Unspecified,
                    activeHardwareFaults: [],
                    activeRadioFaults: [],
                    activeNetworkFaults: [],
                    testEventTriggersEnabled: false
                },
                {
                    testEventTrigger: async (args) => await this.commandHandler.executeHandler("testEventTrigger", args)
                } as ClusterServerHandlers<typeof GeneralDiagnosticsCluster>
            )
        );
    }

    /**
     * Add a new cluster server to the root endpoint
     * BasicInformationCluster and OperationalCredentialsCluster can not be added via this method because they are
     * added in the constructor
     *
     * @param cluster
     */
    override addRootClusterServer<A extends Attributes, C extends Commands>(cluster: ClusterServerObj<A, C>) {
        if (cluster.id === BasicInformationCluster.id) {
            throw new Error(
                "BasicInformationCluster can not be modified, provide all details in constructor options!"
            );
        }
        if (cluster.id === OperationalCredentialsCluster.id) {
            throw new Error(
                "OperationalCredentialsCluster can not be modified, provide the certificates in constructor options!"
            );
        }
        super.addRootClusterServer(cluster);
    }

    /**
     * Advertise the node via mDNS and start the commissioning process
     */
    async advertise() {
        if (this.mdnsBroadcaster === undefined || this.mdnsScanner === undefined || this.storageManager === undefined) {
            throw new Error("Add the node to the Matter instance before!");
        }

        const secureChannelProtocol = new SecureChannelProtocol(
            await PaseServer.fromPin(this.passcode, {
                iterations: 1000,
                salt: Crypto.get().getRandomData(32)
            }),
            new CaseServer()
        );

        this.addRootClusterServer(
            ClusterServer(
                AdminCommissioningCluster,
                {
                    windowStatus: CommissioningWindowStatus.WindowNotOpen,
                    adminFabricIndex: null,
                    adminVendorId: null
                },
                AdminCommissioningHandler(secureChannelProtocol)
            )
        );

        const basicInformation = this.getRootClusterServer(BasicInformationCluster);
        if (basicInformation == undefined) {
            throw new Error("BasicInformationCluster needs to be set!");
        }
        const vendorId = basicInformation.attributes.vendorId.getLocal();
        const productId = basicInformation.attributes.productId.getLocal();

        this.interactionServer = new InteractionServer(this.storageManager);
        const nextEndpointId = Math.max(this.rootEndpoint.findHighestEndpointId() + 1, this.nextEndpointId);
        const lastEndpointId = this.rootEndpoint.ensureEndpointIds(nextEndpointId);
        console.log(`Last endpoint id: ${lastEndpointId}`);
        this.interactionServer.setRootEndpoint(this.rootEndpoint);

        // TODO adjust later and refactor MatterDevice
        this.deviceInstance = new MatterDevice(this.deviceName, this.deviceType, vendorId, productId, this.discriminator, this.storageManager)
            .addNetInterface(await UdpInterface.create(this.port, "udp6", this.listeningAddressIpv6))
            .addScanner(this.mdnsScanner)
            .addBroadcaster(this.mdnsBroadcaster)
            .addProtocolHandler(secureChannelProtocol)
            .addProtocolHandler(this.interactionServer);
        if (!this.disableIpv4) {
            this.deviceInstance.addNetInterface(await UdpInterface.create(this.port, "udp4", this.listeningAddressIpv4))
        }

        await this.deviceInstance.start();
    }

    /**
     * Return info if the device is paired with at least one controller
     */
    isCommissioned(): boolean {
        return this.deviceInstance?.isCommissioned() ?? false;
    }

    /**
     * Return the pairing information for the device
     */
    getPairingCode(): DevicePairingInformation {
        const basicInformation = this.getRootClusterServer(BasicInformationCluster);
        if (basicInformation == undefined) {
            throw new Error("BasicInformationCluster needs to be set!");
        }

        const vendorId = basicInformation.attributes.vendorId.getLocal();
        const productId = basicInformation.attributes.productId.getLocal();

        const qrPairingCode = QrPairingCodeCodec.encode({
            version: 0,
            vendorId: vendorId.id,
            productId,
            flowType: this.flowType,
            discriminator: this.discriminator,
            passcode: this.passcode,
            discoveryCapabilities: DiscoveryCapabilitiesSchema.encode({
                ble: false,
                softAccessPoint: false,
                onIpNetwork: true
            }),
        });

        return {
            manualPairingCode: ManualPairingCodeCodec.encode({
                discriminator: this.discriminator,
                passcode: this.passcode
            }),
            qrPairingCode,
            qrCode: QrCode.encode(qrPairingCode) // TODO: Really export that always?
        };
    }

    /**
     * Set the MDNS Scanner instance. Should be only used internally
     *
     * @param mdnsScanner MdnsScanner instance
     */
    setMdnsScanner(mdnsScanner: MdnsScanner) {
        this.mdnsScanner = mdnsScanner;
    }

    /**
     * Set the MDNS Broadcaster instance. Should be only used internally
     *
     * @param mdnsBroadcaster MdnsBroadcaster instance
     */
    setMdnsBroadcaster(mdnsBroadcaster: MdnsBroadcaster) {
        this.mdnsBroadcaster = mdnsBroadcaster;
    }

    /**
     * Set the StorageManager instance. Should be only used internally
     * @param storageManager
     */
    setStorageManager(storageManager: StorageManager) {
        this.storageManager = storageManager;
    }

    /**
     * Add a new device to the node
     *
     * @param device Device or ComposedDevice instance to add
     */
    addDevice(device: Device | ComposedDevice) {
        this.addEndpoint(device);
    }

    /**
     * Return the port the device is listening on
     */
    getPort(): number {
        return this.port;
    }

    /**
     * close network connections of the device
     */
    async close() {
        await this.deviceInstance?.stop();
    }

    /**
     * Add a new command handler for the given command
     *
     * @param command Command to add the handler for
     * @param handler Handler function to add
     */
    addCommandHandler<K extends keyof CommissioningServerCommands>(command: K, handler: CommissioningServerCommands[K]) {
        this.commandHandler.addHandler(command, handler);
    }

    /**
     * Remove a command handler for the given command
     *
     * @param command Command to remove the handler for
     * @param handler Handler function to remove
     */
    removeCommandHandler<K extends keyof CommissioningServerCommands>(command: K, handler: CommissioningServerCommands[K]) {
        this.commandHandler.removeHandler(command, handler);
    }
}

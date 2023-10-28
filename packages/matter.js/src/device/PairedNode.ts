/**
 * @license
 * Copyright 2022 The matter.js Authors
 * SPDX-License-Identifier: Apache-2.0
 */
import { CommissioningController } from "../CommissioningController.js";
import { Attributes, Cluster, Commands, Events } from "../cluster/Cluster.js";
import { ClusterClientObj, asClusterClientInternal, isClusterClient } from "../cluster/client/ClusterClientTypes.js";

import { getClusterById } from "../cluster/ClusterHelper.js";
import { ClusterClient } from "../cluster/client/ClusterClient.js";
import { DescriptorCluster } from "../cluster/definitions/DescriptorCluster.js";
import { OperationalCredentials } from "../cluster/definitions/OperationalCredentialsCluster.js";
import { ClusterServer } from "../cluster/server/ClusterServer.js";
import {
    AttributeInitialValues,
    AttributeServerValues,
    ClusterServerObj,
    isClusterServer,
} from "../cluster/server/ClusterServerTypes.js";
import { ImplementationError, InternalError, MatterError } from "../common/MatterError.js";
import { ClusterId } from "../datatype/ClusterId.js";
import { EndpointNumber } from "../datatype/EndpointNumber.js";
import { NodeId } from "../datatype/NodeId.js";
import { Logger } from "../log/Logger.js";
import {
    DecodedAttributeReportValue,
    structureReadAttributeDataToClusterObject,
} from "../protocol/interaction/AttributeDataDecoder.js";
import { InteractionClient } from "../protocol/interaction/InteractionClient.js";
import { BitSchema, TypeFromPartialBitSchema } from "../schema/BitmapSchema.js";
import { AtLeastOne } from "../util/Array.js";
import { toHexString } from "../util/Number.js";
import { Aggregator } from "./Aggregator.js";
import { ComposedDevice } from "./ComposedDevice.js";
import { PairedDevice, RootEndpoint } from "./Device.js";

import { BasicInformation } from "../cluster/definitions/BasicInformationCluster.js";
import { AdministratorCommissioning } from "../cluster/definitions/index.js";
import { Crypto } from "../crypto/Crypto.js";
import { DecodedEventReportValue } from "../protocol/interaction/EventDataDecoder.js";
import { StatusResponseError } from "../protocol/interaction/InteractionMessenger.js";
import { StatusCode } from "../protocol/interaction/InteractionProtocol.js";
import {
    CommissionningFlowType,
    DiscoveryCapabilitiesSchema,
    ManualPairingCodeCodec,
    QrPairingCodeCodec,
} from "../schema/PairingCodeSchema.js";
import { PaseClient } from "../session/pase/PaseClient.js";
import { DeviceTypeDefinition, DeviceTypes, UnknownDeviceType, getDeviceTypeDefinitionByCode } from "./DeviceTypes.js";
import { Endpoint } from "./Endpoint.js";
import { logEndpoint } from "./EndpointStructureLogger.js";

const logger = Logger.get("PairedNode");

export type CommissioningControllerNodeOptions = {
    /**
     * Unless set to false all events and attributes are subscribed and value changes are reflected in the ClusterClient
     * instances. With this reading attributes values is mostly looked up in the locally cached data.
     * Additionally more features like reaction on shutdown event or endpoint structure changes (for bridges) are done
     * internally automatically.
     */
    readonly autoSubscribe?: boolean;

    /** Minimum subscription interval when values are changed. Default it is set to 0s.*/
    readonly subscribeMinIntervalFloorSeconds?: number;

    /**
     * Maximum subscription interval when values are changed. This is also used as a keepalive mechanism to validate
     * that the device is still available. Default it is set to 30s.
     */
    readonly subscribeMaxIntervalCeilingSeconds?: number;

    /**
     * Optional additional callback method which is called for each Attribute change reported by the device. Use this
     * if subscribing to all relevant attributes is too much effort.
     */
    readonly attributeChangedCallback?: (data: DecodedAttributeReportValue<any>) => void;

    /**
     * Optional additional callback method which is called for each Event reported by the device. Use this if
     * subscribing to all relevant events is too much effort.
     */
    readonly eventTriggeredCallback?: (data: DecodedEventReportValue<any>) => void;
};

/**
 * Class to represents one node that is paired/commissioned with the matter.js Controller. Instances are returned by
 * the CommissioningController on commissioning or when connecting.
 */
export class PairedNode {
    private readonly endpoints = new Map<EndpointNumber, Endpoint>();
    private interactionClient?: InteractionClient;

    static async create(
        nodeId: NodeId,
        commissioningController: CommissioningController,
        options: CommissioningControllerNodeOptions = {},
        reconnectInteractionClient: () => Promise<InteractionClient>,
        assignDisconnectedHandler: (handler: () => Promise<void>) => void,
    ) {
        const node = new PairedNode(
            nodeId,
            commissioningController,
            options,
            reconnectInteractionClient,
            assignDisconnectedHandler,
        );
        await node.initialize();
        return node;
    }

    constructor(
        readonly nodeId: NodeId,
        private readonly commissioningController: CommissioningController,
        private readonly options: CommissioningControllerNodeOptions = {},
        private readonly reconnectInteractionClient: () => Promise<InteractionClient>,
        assignDisconnectedHandler: (handler: () => Promise<void>) => void,
    ) {
        assignDisconnectedHandler(async () => await this.reconnect());
    }

    /** Reconnect to the device after the active Session was closed. */
    private async reconnect() {
        if (this.interactionClient !== undefined) {
            this.interactionClient.close();
            this.interactionClient = undefined;
        }
        try {
            await this.initialize();
        } catch (error) {
            logger.warn(`Node ${this.nodeId}: Error reconnecting to device`, error);
            // TODO resume logic right now retries and discovers for 60s .. prolong this but without command repeating
        }
    }

    /** Ensure that the node is connected by creating a new InteractionClient if needed. */
    private async ensureConnection() {
        if (this.interactionClient !== undefined) return this.interactionClient;
        this.interactionClient = await this.reconnectInteractionClient();
        return this.interactionClient;
    }

    /**
     * Initialize the node after the InteractionClient was created and to subscribe attributes and events if requested.
     */
    private async initialize() {
        const interactionClient = await this.ensureConnection();
        const { autoSubscribe, attributeChangedCallback, eventTriggeredCallback } = this.options;
        if (autoSubscribe !== false) {
            const initialSubscriptionData = await this.subscribeAllAttributesAndEvents({
                ignoreInitialTriggers: true,
                attributeChangedCallback,
                eventTriggeredCallback,
            }); // Ignore Triggers from Subscribing during initialization

            if (initialSubscriptionData.attributeReports === undefined) {
                throw new InternalError("No attribute reports received when subscribing to all values!");
            }
            await this.initializeEndpointStructure(initialSubscriptionData.attributeReports ?? []);
        } else {
            const allClusterAttributes = await interactionClient.getAllAttributes();
            await this.initializeEndpointStructure(allClusterAttributes);
        }
    }

    /**
     * Request the current InteractionClient for custom special case interactions with the device. Usually the
     * ClusterClients of the Devices of the node should be used instead.
     */
    async getInteractionClient() {
        return await this.ensureConnection();
    }

    /** Method to log the structure of this node with all endpoint and clusters. */
    logStructure() {
        const rootEndpoint = this.endpoints.get(EndpointNumber(0));
        if (rootEndpoint === undefined) {
            logger.info(`Node ${this.nodeId} has not yet been initialized!`);
            return;
        }
        logEndpoint(rootEndpoint);
    }

    /**
     * Subscribe to all attributes and events of the device. Unless setting the Controller property autoSubscribe to
     * false this is executed automatically. Alternatively you can manually subscribe by calling this method.
     */
    async subscribeAllAttributesAndEvents(options?: {
        ignoreInitialTriggers?: boolean;
        attributeChangedCallback?: (data: DecodedAttributeReportValue<any>) => void;
        eventTriggeredCallback?: (data: DecodedEventReportValue<any>) => void;
    }) {
        options = options ?? {};
        const { attributeChangedCallback, eventTriggeredCallback } = options;
        let { ignoreInitialTriggers = false } = options;

        const interactionClient = await this.ensureConnection();
        // If we subscribe anything we use these data to create the endpoint structure, so we do not need to fetch again
        const initialSubscriptionData = await interactionClient.subscribeAllAttributesAndEvents({
            isUrgent: true,
            minIntervalFloorSeconds: this.options.subscribeMinIntervalFloorSeconds ?? 0,
            maxIntervalCeilingSeconds: this.options.subscribeMaxIntervalCeilingSeconds ?? 30,
            attributeListener: data => {
                const {
                    path: { endpointId, clusterId, attributeId },
                    value,
                } = data;
                if (ignoreInitialTriggers) return;
                const device = this.endpoints.get(endpointId);
                if (device === undefined) {
                    logger.info(`Ignoring received attribute update for unknown endpoint ${endpointId}!`);
                    return;
                }
                const cluster = device.getClusterClientById(clusterId);
                if (cluster === undefined) {
                    logger.info(
                        `Ignoring received attribute update for unknown cluster ${toHexString(
                            clusterId,
                        )} on endpoint ${endpointId}!`,
                    );
                    return;
                }
                logger.debug(
                    `Trigger attribute update for ${endpointId}.${cluster.name}.${attributeId} to ${Logger.toJSON(
                        value,
                    )}`,
                );
                asClusterClientInternal(cluster)._triggerAttributeUpdate(attributeId, value);
                if (attributeChangedCallback !== undefined) {
                    attributeChangedCallback(data);
                }
            },
            eventListener: data => {
                const {
                    path: { endpointId, clusterId, eventId },
                    events,
                } = data;
                if (ignoreInitialTriggers) return;
                const device = this.endpoints.get(endpointId);
                if (device === undefined) {
                    logger.info(`Ignoring received event for unknown endpoint ${endpointId}!`);
                    return;
                }
                const cluster = device.getClusterClientById(clusterId);
                if (cluster === undefined) {
                    logger.info(
                        `Ignoring received event for unknown cluster ${toHexString(
                            clusterId,
                        )} on endpoint ${endpointId}!`,
                    );
                    return;
                }
                logger.debug(
                    `Trigger event update for ${endpointId}.${cluster.name}.${eventId} for ${events.length} events`,
                );
                asClusterClientInternal(cluster)._triggerEventUpdate(eventId, events);

                if (eventTriggeredCallback !== undefined) {
                    eventTriggeredCallback(data);
                }

                // When we subscribe all data here then we can also catch this case and handle it
                if (
                    clusterId === BasicInformation.Cluster.id &&
                    eventId === BasicInformation.Cluster.events.shutDown.id
                ) {
                    this.handleNodeShutdown().catch(error =>
                        logger.warn(`Node ${this.nodeId}: Error handling node shutdown`, error),
                    );
                }
            },
            updateTimeoutHandler: async () => {
                logger.warn(`Node ${this.nodeId}: Subscription update not received ...`);
                try {
                    await this.subscribeAllAttributesAndEvents();
                } catch (error) {
                    logger.warn(`Node ${this.nodeId}: Error resubscribing to all attributes and events`, error);
                    // TODO resume logic right now retries and discovers for 60s .. prolong this but without command repeating
                    this.interactionClient = undefined;
                }
            },
        });
        ignoreInitialTriggers = false;
        return initialSubscriptionData;
    }

    /** Handles a node shutDown event (if supported by the node and received). */
    private async handleNodeShutdown() {
        logger.info(`Node ${this.nodeId}: Node shutdown detected, trying to reconnect ...`);
        await this.reconnect();
    }

    /** Reads all data from the device and create a device object structure out of it. */
    private async initializeEndpointStructure(allClusterAttributes: DecodedAttributeReportValue<any>[]) {
        const interactionClient = await this.ensureConnection();
        const allData = structureReadAttributeDataToClusterObject(allClusterAttributes);

        this.endpoints.clear();
        const partLists = new Map<EndpointNumber, EndpointNumber[]>();
        for (const [endpointId, clusters] of Object.entries(allData)) {
            const endpointIdNumber = EndpointNumber(parseInt(endpointId));
            const descriptorData = clusters[DescriptorCluster.id] as AttributeServerValues<
                typeof DescriptorCluster.attributes
            >;

            partLists.set(endpointIdNumber, descriptorData.partsList);

            logger.debug("Creating device", endpointId, Logger.toJSON(clusters));
            this.endpoints.set(endpointIdNumber, this.createDevice(endpointIdNumber, clusters, interactionClient));
        }

        this.structureEndpoints(partLists);
    }

    /** Bring the endpoints in a structure based on their partsList attribute. */
    private structureEndpoints(partLists: Map<EndpointNumber, EndpointNumber[]>) {
        logger.debug(`Node ${this.nodeId}: Endpoints from PartsLists`, Logger.toJSON(Array.from(partLists.entries())));

        const endpointUsages: { [key: EndpointNumber]: EndpointNumber[] } = {};
        Array.from(partLists.entries()).forEach(([parent, partsList]) =>
            partsList.forEach(endPoint => {
                endpointUsages[endPoint] = endpointUsages[endPoint] || [];
                endpointUsages[endPoint].push(parent);
            }),
        );

        logger.debug(`Node ${this.nodeId}: Endpoint usages`, JSON.stringify(endpointUsages));

        while (true) {
            // get all endpoints with only one usage
            const singleUsageEndpoints = Object.entries(endpointUsages).filter(([_, usages]) => usages.length === 1);
            if (singleUsageEndpoints.length === 0) {
                if (Object.entries(endpointUsages).length)
                    throw new InternalError(`Endpoint structure for Node ${this.nodeId} could not be parsed!`);
                break;
            }

            logger.debug(`Node ${this.nodeId}: Processing Endpoint ${JSON.stringify(singleUsageEndpoints)}`);

            const idsToCleanup: { [key: EndpointNumber]: boolean } = {};
            singleUsageEndpoints.forEach(([childId, usages]) => {
                const childEndpoint = this.endpoints.get(EndpointNumber(parseInt(childId)));
                const parentEndpoint = this.endpoints.get(usages[0]);
                if (childEndpoint === undefined || parentEndpoint === undefined) {
                    throw new InternalError(`Node ${this.nodeId}: Endpoint not found!`); // Should never happen!
                }

                logger.debug(
                    `Node ${this.nodeId}: Endpoint structure: Child: ${childEndpoint.id} -> Parent: ${parentEndpoint.id}`,
                );

                parentEndpoint.addChildEndpoint(childEndpoint);
                delete endpointUsages[EndpointNumber(parseInt(childId))];
                idsToCleanup[usages[0]] = true;
            });
            logger.debug(`Node ${this.nodeId}: Endpoint data Cleanup`, JSON.stringify(idsToCleanup));
            Object.keys(idsToCleanup).forEach(idToCleanup => {
                Object.keys(endpointUsages).forEach(id => {
                    const usageId = EndpointNumber(parseInt(id));
                    endpointUsages[usageId] = endpointUsages[usageId].filter(
                        endpointId => endpointId !== parseInt(idToCleanup),
                    );
                    if (!endpointUsages[usageId].length) {
                        delete endpointUsages[usageId];
                    }
                });
            });
        }
    }

    /**
     * Create a device object from the data read from the device.
     *
     * @param endpointId Endpoint ID
     * @param data Data of all clusters read from the device
     * @param interactionClient InteractionClient to use for the device
     * @private
     */
    private createDevice(
        endpointId: EndpointNumber,
        data: { [key: ClusterId]: { [key: string]: any } },
        interactionClient: InteractionClient,
    ) {
        const descriptorData = data[DescriptorCluster.id] as AttributeServerValues<typeof DescriptorCluster.attributes>;

        const deviceTypes = descriptorData.deviceTypeList.flatMap(({ deviceType, revision }) => {
            const deviceTypeDefinition = getDeviceTypeDefinitionByCode(deviceType);
            if (deviceTypeDefinition === undefined) {
                logger.info(
                    `NodeId ${this.nodeId}: Device type with code ${deviceType} not known, use generic replacement.`,
                );
                return UnknownDeviceType(deviceType);
            }
            if (deviceTypeDefinition.revision < revision) {
                logger.debug(
                    `NodeId ${this.nodeId}: Device type with code ${deviceType} and revision ${revision} not supported, some data might be unknown.`,
                );
            }
            return deviceTypeDefinition;
        });
        if (deviceTypes.length === 0) {
            logger.info(`NodeId ${this.nodeId}: No device type found for endpoint ${endpointId}, ignore`);
            throw new MatterError(`NodeId ${this.nodeId}: No device type found for endpoint`);
        }

        const endpointClusters = Array<
            ClusterServerObj<Attributes, Events> | ClusterClientObj<any, Attributes, Commands, Events>
        >();

        // Add ClusterClients for all server clusters of the device
        for (const clusterId of descriptorData.serverList) {
            const cluster = getClusterById(clusterId);
            const clusterClient = ClusterClient(cluster, endpointId, interactionClient, data[clusterId]);
            endpointClusters.push(clusterClient);
        }

        // TODO use the attributes attributeList, acceptedCommands, generatedCommands to create the ClusterClient/Server objects
        // Add ClusterServers for all client clusters of the device
        for (const clusterId of descriptorData.clientList) {
            const cluster = getClusterById(clusterId);
            const clusterData = (data[clusterId] ?? {}) as AttributeInitialValues<Attributes>; // TODO correct typing
            // Todo add logic for Events
            endpointClusters.push(
                ClusterServer(cluster, /*clusterData.featureMap,*/ clusterData, {}) as ClusterServerObj<
                    Attributes,
                    Events
                >,
            ); // TODO Add Default handler!
        }

        if (endpointId === 0) {
            // Endpoint 0 is the root endpoint, so we use a RootEndpoint object
            const rootEndpoint = new RootEndpoint();
            rootEndpoint.setDeviceTypes(deviceTypes as AtLeastOne<DeviceTypeDefinition>); // Ideally only root one as defined
            endpointClusters.forEach(cluster => {
                if (isClusterServer(cluster)) {
                    rootEndpoint.addClusterServer(cluster);
                } else if (isClusterClient(cluster)) {
                    rootEndpoint.addClusterClient(cluster);
                }
            });
            return rootEndpoint;
        } else if (deviceTypes.find(deviceType => deviceType.code === DeviceTypes.AGGREGATOR.code) !== undefined) {
            // When AGGREGATOR is in the device type list, this is an aggregator
            const aggregator = new Aggregator([], { endpointId });
            aggregator.setDeviceTypes(deviceTypes as AtLeastOne<DeviceTypeDefinition>);
            endpointClusters.forEach(cluster => {
                // TODO There should be none?
                if (isClusterServer(cluster)) {
                    aggregator.addClusterServer(cluster);
                } else if (isClusterClient(cluster)) {
                    aggregator.addClusterClient(cluster);
                }
            });
            return aggregator;
        } else {
            // It seems to be device but has a partsList, so it is a composed device
            if (descriptorData.partsList.length > 0) {
                const composedDevice = new ComposedDevice(deviceTypes[0], [], { endpointId });
                composedDevice.setDeviceTypes(deviceTypes as AtLeastOne<DeviceTypeDefinition>);
                endpointClusters.forEach(cluster => {
                    if (isClusterServer(cluster)) {
                        composedDevice.addClusterServer(cluster);
                    } else if (isClusterClient(cluster)) {
                        composedDevice.addClusterClient(cluster);
                    }
                });
                return composedDevice;
            } else {
                // else it's a normal Device
                // TODO Should we find the really correct Device derived class to instance?
                return new PairedDevice(deviceTypes as AtLeastOne<DeviceTypeDefinition>, endpointClusters, endpointId);
            }
        }
    }

    /** Returns the devices/endpoints known for this node. */
    getDevices(): Endpoint[] {
        return this.endpoints.get(EndpointNumber(0))?.getChildEndpoints() ?? [];
    }

    /** Returns the device/endpoint with the given endpoint ID. */
    getDeviceById(endpointId: number) {
        return this.endpoints.get(EndpointNumber(endpointId));
    }

    /** De-Commission (unpair) the device from this controller by removing the fabric from the device. */
    async decommission() {
        if (!this.commissioningController.isNodeCommissioned(this.nodeId)) {
            throw new ImplementationError(`This Node ${this.nodeId} is not commissioned.`);
        }
        const operationalCredentialsCluster = this.getRootClusterClient(OperationalCredentials.Cluster);

        if (operationalCredentialsCluster === undefined) {
            throw new ImplementationError(`OperationalCredentialsCluster for node ${this.nodeId} not found.`);
        }

        const fabricIndex = await operationalCredentialsCluster.getCurrentFabricIndexAttribute(true);

        logger.debug(`Removing node ${this.nodeId} by removing fabric ${fabricIndex} on the node.`);

        const result = await operationalCredentialsCluster.commands.removeFabric({ fabricIndex });
        if (result.statusCode !== OperationalCredentials.NodeOperationalCertStatus.Ok) {
            throw new MatterError(
                `Removing node ${this.nodeId} failed with status ${result.statusCode} "${result.debugText}".`,
            );
        }
        await this.commissioningController.removeNode(this.nodeId, false);
    }

    /** Opens a Basic Commissioning Window (uses the original Passcode printed on the device) with the device. */
    async openBasicCommissioningWindow(commissioningTimeout = 900 /* 15 minutes */) {
        const adminCommissioningCluster = this.getRootClusterClient(AdministratorCommissioning.Cluster.with("Basic"));
        if (adminCommissioningCluster === undefined) {
            throw new ImplementationError(`AdministratorCommissioningCluster for node ${this.nodeId} not found.`);
        }
        if (adminCommissioningCluster.supportedFeatures.basic === false) {
            throw new ImplementationError(
                `AdministratorCommissioningCluster for node ${this.nodeId} does not support basic commissioning.`,
            );
        }

        try {
            await adminCommissioningCluster.commands.revokeCommissioning();
        } catch (error) {
            // Accept the error if no window is already open
            if (
                !(error instanceof StatusResponseError) ||
                error.code !== StatusCode.Failure ||
                error.clusterCode !== AdministratorCommissioning.StatusCode.WindowNotOpen
            ) {
                throw error;
            }
        }

        await adminCommissioningCluster.commands.openBasicCommissioningWindow({ commissioningTimeout });
    }

    /** Opens an Enhanced Commissioning Window (uses a generated random Passcode) with the device. */
    async openEnhancedCommissioningWindow(commissioningTimeout = 900 /* 15 minutes */) {
        const adminCommissioningCluster = this.getRootClusterClient(AdministratorCommissioning.Cluster);
        if (adminCommissioningCluster === undefined) {
            throw new ImplementationError(`AdministratorCommissioningCluster for node ${this.nodeId} not found.`);
        }

        try {
            await adminCommissioningCluster.commands.revokeCommissioning();
        } catch (error) {
            // Accept the error if no window is already open
            if (
                !(error instanceof StatusResponseError) ||
                error.code !== StatusCode.Failure ||
                error.clusterCode !== AdministratorCommissioning.StatusCode.WindowNotOpen
            ) {
                throw error;
            }
        }

        const basicInformationCluster = this.getRootClusterClient(BasicInformation.Cluster);
        if (basicInformationCluster == undefined) {
            throw new ImplementationError(`BasicInformationCluster for node ${this.nodeId} not found.`);
        }

        const vendorId = await basicInformationCluster.getVendorIdAttribute();
        const productId = await basicInformationCluster.getProductIdAttribute();

        const discriminator = PaseClient.generateRandomDiscriminator();
        const passcode = PaseClient.generateRandomPasscode();
        const salt = Crypto.get().getRandomData(32);
        const iterations = 1_000; // Minimum 1_000, Maximum 100_000
        const pakePasscodeVerifier = await PaseClient.generatePakePasscodeVerifier(passcode, {
            iterations,
            salt,
        });
        await adminCommissioningCluster.commands.openCommissioningWindow({
            commissioningTimeout,
            pakePasscodeVerifier,
            salt,
            iterations,
            discriminator,
        });

        // TODO: If Timeout is shorter then 15 minutes set the timeout also in TlvData of QR-Code
        const qrPairingCode = QrPairingCodeCodec.encode({
            version: 0,
            vendorId,
            productId,
            flowType: CommissionningFlowType.Standard,
            discriminator: discriminator,
            passcode: passcode,
            discoveryCapabilities: DiscoveryCapabilitiesSchema.encode({
                onIpNetwork: true,
            }),
        });

        return {
            manualPairingCode: ManualPairingCodeCodec.encode({
                discriminator: discriminator,
                passcode: passcode,
            }),
            qrPairingCode,
        };
    }

    /**
     * Get a cluster server from the root endpoint. This is mainly used internally and not needed to be called by the user.
     *
     * @param cluster ClusterServer to get or undefined if not existing
     */
    getRootClusterServer<
        F extends BitSchema,
        SF extends TypeFromPartialBitSchema<F>,
        A extends Attributes,
        C extends Commands,
        E extends Events,
    >(cluster: Cluster<F, SF, A, C, E>): ClusterServerObj<A, E> | undefined {
        return this.endpoints.get(EndpointNumber(0))?.getClusterServer(cluster);
    }

    /**
     * Get a cluster client from the root endpoint. This is mainly used internally and not needed to be called by the user.
     *
     * @param cluster ClusterClient to get or undefined if not existing
     */
    getRootClusterClient<
        F extends BitSchema,
        SF extends TypeFromPartialBitSchema<F>,
        A extends Attributes,
        C extends Commands,
        E extends Events,
    >(cluster: Cluster<F, SF, A, C, E>): ClusterClientObj<F, A, C, E> | undefined {
        return this.endpoints.get(EndpointNumber(0))?.getClusterClient(cluster);
    }
}

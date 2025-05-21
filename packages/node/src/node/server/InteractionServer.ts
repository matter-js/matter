/**
 * @license
 * Copyright 2022-2025 Matter.js Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { NodeActivity } from "#behavior/context/NodeActivity.js";
import { OnlineContext } from "#behavior/index.js";
import { AccessControlServer } from "#behaviors/access-control";
import { AccessControl as AccessControlClusterType } from "#clusters/access-control";
import {
    Crypto,
    Diagnostic,
    InternalError,
    Logger,
    MatterError,
    MaybePromise,
    Observable,
    ServerAddressIp,
} from "#general";
import { GLOBAL_IDS, Specification } from "#model";
import {
    assertSecureSession,
    DataReport,
    DataReportPayloadIterator,
    ExchangeManager,
    InteractionRecipient,
    InteractionServerMessenger,
    InvokeRequest,
    Message,
    MessageExchange,
    MessageType,
    PeerAddress,
    ProtocolHandler,
    ReadRequest,
    SecureSession,
    SessionManager,
    SessionType,
    SubscribeRequest,
    TimedRequest,
    WriteRequest,
    WriteResponse,
    WriteResult,
} from "#protocol";
import {
    DEFAULT_MAX_PATHS_PER_INVOKE,
    INTERACTION_PROTOCOL_ID,
    ReceivedStatusResponseError,
    StatusCode,
    StatusResponseError,
    TlvAny,
    TlvAttributePath,
    TlvClusterPath,
    TlvEventPath,
    TlvInvokeResponseData,
    TlvInvokeResponseForSend,
    TlvSubscribeResponse,
    TypeFromSchema,
} from "#types";
import { ServerNode } from "../ServerNode.js";
import { OnlineServerInteraction } from "./OnlineServerInteraction.js";
import { ServerSubscription, ServerSubscriptionConfig, ServerSubscriptionContext } from "./ServerSubscription.js";

const logger = Logger.get("InteractionServer");

export const activityKey = Symbol("activity");

export interface WithActivity {
    [activityKey]?: NodeActivity.Activity;
}

const AclClusterId = AccessControlClusterType.Complete.id;
const AclAttributeId = AccessControlClusterType.Complete.attributes.acl.id;
const AclExtensionAttributeId = AccessControlClusterType.Complete.attributes.extension.id;

export interface PeerSubscription {
    subscriptionId: number;
    peerAddress: PeerAddress;
    minIntervalFloorSeconds: number;
    maxIntervalCeilingSeconds: number;
    attributeRequests?: TypeFromSchema<typeof TlvAttributePath>[];
    eventRequests?: TypeFromSchema<typeof TlvEventPath>[];
    isFabricFiltered: boolean;
    maxInterval: number;
    sendInterval: number;
    operationalAddress?: ServerAddressIp;
}

function validateReadAttributesPath(path: TypeFromSchema<typeof TlvAttributePath>, isGroupSession = false) {
    if (isGroupSession) {
        throw new StatusResponseError("Illegal read request with group session", StatusCode.InvalidAction);
    }
    const { clusterId, attributeId } = path;
    if (clusterId === undefined && attributeId !== undefined) {
        if (!GLOBAL_IDS.has(attributeId)) {
            throw new StatusResponseError(
                `Illegal read request for wildcard cluster and non global attribute ${attributeId}`,
                StatusCode.InvalidAction,
            );
        }
    }
}

function validateReadEventPath(path: TypeFromSchema<typeof TlvEventPath>, isGroupSession = false) {
    const { clusterId, eventId } = path;
    if (clusterId === undefined && eventId !== undefined) {
        throw new StatusResponseError("Illegal read request with wildcard cluster ID", StatusCode.InvalidAction);
    }
    if (isGroupSession) {
        throw new StatusResponseError("Illegal read request with group session", StatusCode.InvalidAction);
    }
}

function clusterPathToId({ nodeId, endpointId, clusterId }: TypeFromSchema<typeof TlvClusterPath>) {
    return `${nodeId}/${endpointId}/${clusterId}`;
}

/**
 * Interfaces {@link InteractionServer} with other components.
 */
export interface InteractionContext {
    readonly sessions: SessionManager;
    readonly exchangeManager: ExchangeManager;
}

/**
 * Translates interactions from the Matter protocol to matter.js APIs.
 */
export class InteractionServer implements ProtocolHandler, InteractionRecipient {
    readonly id = INTERACTION_PROTOCOL_ID;
    readonly requiresSecureSession = true;
    #context: InteractionContext;
    #nextSubscriptionId = Crypto.getRandomUInt32();
    #isClosing = false;
    #clientHandler?: ProtocolHandler;
    readonly #subscriptionConfig: ServerSubscriptionConfig;
    readonly #maxPathsPerInvoke;
    readonly #subscriptionEstablishmentStarted = Observable<[peerAddress: PeerAddress]>();
    #node: ServerNode;
    #activity: NodeActivity;
    #newActivityBlocked = false;
    #aclServer?: AccessControlServer;
    #aclUpdateIsDelayedInExchange = new Set<MessageExchange>();
    #serverInteraction: OnlineServerInteraction;

    constructor(node: ServerNode, sessions: SessionManager) {
        this.#context = {
            sessions,
            exchangeManager: node.env.get(ExchangeManager),
        };

        this.#subscriptionConfig = ServerSubscriptionConfig.of(node.state.network.subscriptionOptions);
        this.#maxPathsPerInvoke = node.state.basicInformation.maxPathsPerInvoke ?? DEFAULT_MAX_PATHS_PER_INVOKE;

        this.#activity = node.env.get(NodeActivity);

        this.#node = node;

        // ServerInteraction is the "new way" and will replace most logic here over time and especially
        // the InteractionEndpointStructure, which is currently a duplication of the node protocol
        this.#serverInteraction = new OnlineServerInteraction(node.protocol);
    }

    async [Symbol.asyncDispose]() {
        await this.close();
    }

    blockNewActivity() {
        this.#newActivityBlocked = true;
    }

    protected get isClosing() {
        return this.#isClosing;
    }

    get maxPathsPerInvoke() {
        return this.#maxPathsPerInvoke;
    }

    get subscriptionEstablishmentStarted() {
        return this.#subscriptionEstablishmentStarted;
    }

    async onNewExchange(exchange: MessageExchange, message: Message) {
        // When closing, ignore anything newly incoming
        if (this.#newActivityBlocked || this.isClosing) {
            return;
        }

        // An incoming data report as the first message is not a valid server operation.  We instead delegate to a
        // client implementation if available
        if (message.payloadHeader.messageType === MessageType.ReportData && this.clientHandler) {
            return this.clientHandler.onNewExchange(exchange, message);
        }

        // Activity tracking.  This provides diagnostic information and prevents the server from shutting down whilst
        // the exchange is active
        using activity = this.#activity.begin(`session#${exchange.session.id.toString(16)}`);
        (exchange as WithActivity)[activityKey] = activity;

        // Delegate to InteractionServerMessenger
        return new InteractionServerMessenger(exchange)
            .handleRequest(this)
            .finally(() => delete (exchange as WithActivity)[activityKey]);
    }

    get aclServer() {
        if (this.#aclServer !== undefined) {
            return this.#aclServer;
        }
        const aclServer = this.#node.act(agent => agent.get(AccessControlServer));
        if (MaybePromise.is(aclServer)) {
            throw new InternalError("AccessControlServer should already be initialized.");
        }
        return (this.#aclServer = aclServer);
    }

    get clientHandler(): ProtocolHandler | undefined {
        return this.#clientHandler;
    }

    set clientHandler(clientHandler: ProtocolHandler) {
        this.#clientHandler = clientHandler;
    }

    #prepareOnlineContext(
        exchange: MessageExchange,
        message: Message,
        fabricFiltered?: boolean,
        timed = false,
    ): OnlineContext.Options {
        return {
            activity: (exchange as WithActivity)[activityKey],
            fabricFiltered,
            timed,
            message,
            exchange,
            node: this.#node,
        };
    }

    /**
     * Returns an iterator that yields the data reports and events data for the given read request.
     */
    async *#executeReadInteraction(readRequest: ReadRequest, exchange: MessageExchange, message: Message) {
        const readContext = this.#prepareOnlineContext(exchange, message, readRequest.isFabricFiltered);

        for await (const chunk of this.#serverInteraction.read(readRequest, readContext)) {
            for (const report of chunk) {
                yield InteractionServerMessenger.convertServerInteractionReport(report);
            }
        }
    }

    async handleReadRequest(
        exchange: MessageExchange,
        readRequest: ReadRequest,
        message: Message,
    ): Promise<{ dataReport: DataReport; payload?: DataReportPayloadIterator }> {
        const {
            attributeRequests,
            eventRequests,
            isFabricFiltered,
            dataVersionFilters,
            eventFilters,
            interactionModelRevision,
        } = readRequest;
        logger.debug(
            () =>
                `Received read request from ${exchange.channel.name}: attributes:${
                    attributeRequests?.map(path => this.#node.protocol.inspectPath(path)).join(", ") ?? "none"
                }${dataVersionFilters?.length ? ` with ${dataVersionFilters?.length} filters` : ""}, events:${
                    eventRequests?.map(path => this.#node.protocol.inspectPath(path)).join(", ") ?? "none"
                }${eventFilters?.length ? `, ${eventFilters?.length} filters` : ""}, isFabricFiltered=${isFabricFiltered}`,
        );

        if (interactionModelRevision > Specification.INTERACTION_MODEL_REVISION) {
            logger.debug(
                `Interaction model revision of sender ${interactionModelRevision} is higher than supported ${Specification.INTERACTION_MODEL_REVISION}.`,
            );
        }
        if (attributeRequests === undefined && eventRequests === undefined) {
            return {
                dataReport: {
                    interactionModelRevision: Specification.INTERACTION_MODEL_REVISION,
                    suppressResponse: true,
                },
            };
        }

        if (message.packetHeader.sessionType !== SessionType.Unicast) {
            throw new StatusResponseError(
                "Reads are only allowed on unicast sessions", // Means "No groups"
                StatusCode.InvalidAction,
            );
        }

        return {
            dataReport: {
                interactionModelRevision: Specification.INTERACTION_MODEL_REVISION,
                suppressResponse: true,
            },
            payload: this.#executeReadInteraction(readRequest, exchange, message),
        };
    }

    async handleWriteRequest(
        exchange: MessageExchange,
        writeRequest: WriteRequest,
        message: Message,
    ): Promise<WriteResponse> {
        const { suppressResponse, timedRequest, writeRequests, interactionModelRevision, moreChunkedMessages } =
            writeRequest;
        const sessionType = message.packetHeader.sessionType;
        logger.debug(
            () =>
                `Received write request from ${exchange.channel.name}: ${writeRequests
                    .map(req => this.#node.protocol.inspectPath(req.path))
                    .join(", ")}, suppressResponse=${suppressResponse}, moreChunkedMessages=${moreChunkedMessages}`,
        );

        if (moreChunkedMessages && suppressResponse) {
            throw new StatusResponseError(
                "MoreChunkedMessages and SuppressResponse cannot be used together in write messages",
                StatusCode.InvalidAction,
            );
        }

        if (interactionModelRevision > Specification.INTERACTION_MODEL_REVISION) {
            logger.debug(
                `Interaction model revision of sender ${interactionModelRevision} is higher than supported ${Specification.INTERACTION_MODEL_REVISION}.`,
            );
        }

        const receivedWithinTimedInteraction = exchange.hasActiveTimedInteraction();

        if (receivedWithinTimedInteraction && moreChunkedMessages) {
            throw new StatusResponseError(
                "Write Request action that is part of a Timed Write Interaction SHALL NOT be chunked.",
                StatusCode.InvalidAction,
            );
        }

        if (exchange.hasExpiredTimedInteraction()) {
            exchange.clearTimedInteraction(); // ??
            throw new StatusResponseError(`Timed request window expired. Decline write request.`, StatusCode.Timeout);
        }

        if (timedRequest !== exchange.hasTimedInteraction()) {
            throw new StatusResponseError(
                `timedRequest flag of write interaction (${timedRequest}) mismatch with expected timed interaction (${receivedWithinTimedInteraction}).`,
                StatusCode.TimedRequestMismatch,
            );
        }

        if (receivedWithinTimedInteraction) {
            logger.debug(
                `Write request from ${exchange.channel.name} successfully received while timed interaction is running.`,
            );
            exchange.clearTimedInteraction();
            if (sessionType !== SessionType.Unicast) {
                throw new StatusResponseError(
                    "Write requests are only allowed on unicast sessions when a timed interaction is running.",
                    StatusCode.InvalidAction,
                );
            }
        }

        if (sessionType === SessionType.Group && !suppressResponse) {
            throw new StatusResponseError(
                "Write requests are only allowed as group casts when suppressResponse=true.",
                StatusCode.InvalidAction,
            );
        }

        // This is a hack to prevent the ACL from updating while we are in the middle of a write transaction
        // and is needed because Acl should not become effective during writing of the ACL itself.
        // We check if any ACL path is written and assume that acl write will happen, so we delay the update.
        // If nothing changed in the end this does not matter
        for (const {
            path: { endpointId, clusterId, attributeId },
        } of writeRequest.writeRequests) {
            if (
                (endpointId === undefined || endpointId === 0) &&
                clusterId === AclClusterId &&
                (attributeId === AclAttributeId || attributeId === AclExtensionAttributeId)
            ) {
                this.aclServer.aclUpdateDelayed = true;
                this.#aclUpdateIsDelayedInExchange.add(exchange);
            }
        }

        let result: Awaited<WriteResult<any>>;
        try {
            // TODO: We still need to add multi message writes!

            result = await this.#serverInteraction.write(
                writeRequest,
                this.#prepareOnlineContext(
                    exchange,
                    message,
                    true, // always fabric filtered
                    receivedWithinTimedInteraction,
                ),
            );
        } catch (error) {
            if (this.#aclUpdateIsDelayedInExchange.has(exchange)) {
                // Unlikely to get there at all, but make sure we handle it best we can for now
                this.#aclUpdateIsDelayedInExchange.delete(exchange);

                if (this.#aclUpdateIsDelayedInExchange.size === 0) {
                    // only that one ACl change in flight, so we can reset the delayed ACL
                    this.aclServer.resetDelayedAccessControlList();
                } else {
                    // TODO: we should restore the delayed data just for this errored fabric?
                    logger.error("One of multiple concurrent ACL writes failed, unhandled case for now.");
                }
            }
            throw error;
        }

        // We delayed the ACL update during this write transaction, so we need to update it now that anything is written
        if (this.#aclUpdateIsDelayedInExchange.has(exchange)) {
            this.#aclUpdateIsDelayedInExchange.delete(exchange);

            if (this.#aclUpdateIsDelayedInExchange.size === 0) {
                //  Committing the ACL changes in case of an unhandled exception might be dangerous, but we do it anyway
                this.aclServer.aclUpdateDelayed = false;
            } else {
                logger.info("Multiple concurrent ACL writes, waiting for all to finish.");
            }
        }

        return {
            writeResponses: result?.map(({ path, status, clusterStatus }) => ({
                path,
                status: { status, clusterStatus },
            })),
            interactionModelRevision: Specification.INTERACTION_MODEL_REVISION,
        };
    }

    async handleSubscribeRequest(
        exchange: MessageExchange,
        request: SubscribeRequest,
        messenger: InteractionServerMessenger,
        message: Message,
    ): Promise<void> {
        const {
            minIntervalFloorSeconds,
            maxIntervalCeilingSeconds,
            attributeRequests,
            dataVersionFilters,
            eventRequests,
            eventFilters,
            keepSubscriptions,
            isFabricFiltered,
            interactionModelRevision,
        } = request;
        logger.debug(
            `Received subscribe request from ${exchange.channel.name} (keepSubscriptions=${keepSubscriptions}, isFabricFiltered=${isFabricFiltered})`,
        );

        if (interactionModelRevision > Specification.INTERACTION_MODEL_REVISION) {
            logger.debug(
                `Interaction model revision of sender ${interactionModelRevision} is higher than supported ${Specification.INTERACTION_MODEL_REVISION}.`,
            );
        }

        if (message.packetHeader.sessionType !== SessionType.Unicast) {
            throw new StatusResponseError(
                "Subscriptions are only allowed on unicast sessions",
                StatusCode.InvalidAction,
            );
        }

        assertSecureSession(exchange.session, "Subscriptions are only implemented on secure sessions");
        const session = exchange.session;
        const fabric = session.fabric;
        if (fabric === undefined)
            throw new StatusResponseError(
                "Subscriptions are only implemented after a fabric has been assigned",
                StatusCode.InvalidAction,
            );

        if (!keepSubscriptions) {
            const clearedCount = await this.#context.sessions.clearSubscriptionsForNode(
                fabric.addressOf(session.peerNodeId),
                true,
            );
            if (clearedCount > 0) {
                logger.debug(
                    `Cleared ${clearedCount} subscriptions for Subscriber node ${session.peerNodeId} because keepSubscriptions=false`,
                );
            }
        }

        if (
            (!Array.isArray(attributeRequests) || attributeRequests.length === 0) &&
            (!Array.isArray(eventRequests) || eventRequests.length === 0)
        ) {
            throw new StatusResponseError("No attributes or events requested", StatusCode.InvalidAction);
        }

        logger.debug(
            () =>
                `Subscribe to attributes:${
                    attributeRequests?.map(path => this.#node.protocol.inspectPath(path)).join(", ") ?? "none"
                }, events:${eventRequests?.map(path => this.#node.protocol.inspectPath(path)).join(", ") ?? "none"}`,
        );

        if (dataVersionFilters !== undefined && dataVersionFilters.length > 0) {
            logger.debug(
                `DataVersionFilters: ${dataVersionFilters
                    .map(
                        ({ path: { nodeId, endpointId, clusterId }, dataVersion }) =>
                            `${clusterPathToId({ nodeId, endpointId, clusterId })}=${dataVersion}`,
                    )
                    .join(", ")}`,
            );
        }
        if (eventFilters !== undefined && eventFilters.length > 0)
            logger.debug(
                `Event filters: ${eventFilters.map(filter => `${filter.nodeId}/${filter.eventMin}`).join(", ")}`,
            );

        // Validate of the paths before proceeding
        attributeRequests?.forEach(path => validateReadAttributesPath(path));
        eventRequests?.forEach(path => validateReadEventPath(path));

        if (minIntervalFloorSeconds < 0) {
            throw new StatusResponseError(
                "minIntervalFloorSeconds should be greater or equal to 0",
                StatusCode.InvalidAction,
            );
        }
        if (maxIntervalCeilingSeconds < 0) {
            throw new StatusResponseError(
                "maxIntervalCeilingSeconds should be greater or equal to 1",
                StatusCode.InvalidAction,
            );
        }
        if (maxIntervalCeilingSeconds < minIntervalFloorSeconds) {
            throw new StatusResponseError(
                "maxIntervalCeilingSeconds should be greater or equal to minIntervalFloorSeconds",
                StatusCode.InvalidAction,
            );
        }

        if (this.#nextSubscriptionId === 0xffffffff) this.#nextSubscriptionId = 0;
        const subscriptionId = this.#nextSubscriptionId++;

        this.#subscriptionEstablishmentStarted.emit(session.peerAddress);
        let subscription: ServerSubscription;
        try {
            subscription = await this.#establishSubscription(
                subscriptionId,
                request,
                messenger,
                session,
                exchange,
                message,
            );
        } catch (error) {
            logger.error(
                `Subscription ${subscriptionId} for Session ${session.id}: Error while sending initial data reports`,
                error instanceof MatterError ? error.message : error,
            );
            if (error instanceof StatusResponseError && !(error instanceof ReceivedStatusResponseError)) {
                logger.info(`Sending status response ${error.code} for interaction error: ${error.message}`);
                await messenger.sendStatus(error.code, {
                    logContext: {
                        for: "I/SubscriptionSeed-Status",
                    },
                });
            }
            await messenger.close();
            return; // Make sure to not bubble up the exception
        }

        const maxInterval = subscription.maxInterval;
        // Then send the subscription response
        await messenger.send(
            MessageType.SubscribeResponse,
            TlvSubscribeResponse.encode({
                subscriptionId,
                maxInterval,
                interactionModelRevision: Specification.INTERACTION_MODEL_REVISION,
            }),
            {
                logContext: {
                    subId: subscriptionId,
                    maxInterval,
                },
            },
        );

        // When an error occurs while sending the response, the subscription is not yet active and will be cleaned up by GC
        subscription.activate();
    }

    async #establishSubscription(
        id: number,
        {
            minIntervalFloorSeconds,
            maxIntervalCeilingSeconds,
            attributeRequests,
            dataVersionFilters,
            eventRequests,
            eventFilters,
            isFabricFiltered,
        }: SubscribeRequest,
        messenger: InteractionServerMessenger,
        session: SecureSession,
        exchange: MessageExchange,
        message: Message,
    ) {
        const context: ServerSubscriptionContext = {
            session,
            node: this.#node,
            initiateExchange: (address: PeerAddress, protocolId) =>
                this.#context.exchangeManager.initiateExchange(address, protocolId),
        };

        const subscription = new ServerSubscription({
            id,
            context,
            criteria: {
                attributeRequests,
                dataVersionFilters,
                eventRequests,
                eventFilters,
                isFabricFiltered,
            },
            minIntervalFloorSeconds,
            maxIntervalCeilingSeconds,
            subscriptionOptions: this.#subscriptionConfig,
        });

        const readContext = this.#prepareOnlineContext(exchange, message, isFabricFiltered);
        try {
            // Send the initial data report to prime the subscription with initial data
            await subscription.sendInitialReport(messenger, readContext);
        } catch (error) {
            await subscription.close(); // Cleanup
            throw error;
        }

        logger.info(
            `Successfully created subscription ${id} for Session ${
                session.id
            } to ${session.peerAddress}. Updates: ${minIntervalFloorSeconds} - ${maxIntervalCeilingSeconds} => ${subscription.maxInterval} seconds (sendInterval = ${subscription.sendInterval} seconds)`,
        );
        return subscription;
    }

    async establishFormerSubscription(
        {
            subscriptionId,
            attributeRequests,
            eventRequests,
            isFabricFiltered,
            minIntervalFloorSeconds,
            maxIntervalCeilingSeconds,
            maxInterval,
            sendInterval,
        }: PeerSubscription,
        session: SecureSession,
    ) {
        const exchange = this.#context.exchangeManager.initiateExchange(session.peerAddress, INTERACTION_PROTOCOL_ID);
        const message = {} as Message;
        logger.debug(
            `Send DataReports to re-establish subscription ${subscriptionId} to `,
            Diagnostic.dict({ isFabricFiltered, maxInterval, sendInterval }),
        );
        const context: ServerSubscriptionContext = {
            session,
            node: this.#node,
            initiateExchange: (address: PeerAddress, protocolId) =>
                this.#context.exchangeManager.initiateExchange(address, protocolId),
        };

        const subscription = new ServerSubscription({
            id: subscriptionId,
            context,
            minIntervalFloorSeconds,
            maxIntervalCeilingSeconds,
            criteria: {
                attributeRequests,
                eventRequests,
                isFabricFiltered,
            },
            subscriptionOptions: this.#subscriptionConfig,
            useAsMaxInterval: maxInterval,
            useAsSendInterval: sendInterval,
        });

        const readContext = this.#prepareOnlineContext(exchange, message, isFabricFiltered);
        try {
            // Send initial data report to prime the subscription with initial data
            await subscription.sendInitialReport(
                new InteractionServerMessenger(exchange),
                readContext,
                true, // Do not send status responses because we simulate that the subscription is still established
            );
            subscription.activate();
            logger.info(
                `Successfully re-established subscription ${subscriptionId} for Session ${
                    session.id
                } to ${session.peerAddress}. Updates: ${minIntervalFloorSeconds} - ${maxIntervalCeilingSeconds} => ${subscription.maxInterval} seconds (sendInterval = ${subscription.sendInterval} seconds)`,
            );
        } catch (error) {
            await subscription.close(); // Cleanup
            throw error;
        }
        return subscription;
    }

    async handleInvokeRequest(
        exchange: MessageExchange,
        request: InvokeRequest,
        messenger: InteractionServerMessenger,
        message: Message,
    ): Promise<void> {
        const { invokeRequests, timedRequest, suppressResponse, interactionModelRevision } = request;
        logger.debug(
            () =>
                `Received invoke request from ${exchange.channel.name}${invokeRequests.length > 0 ? ` with ${invokeRequests.length} commands` : ""}: ${invokeRequests
                    .map(({ commandPath: { endpointId, clusterId, commandId } }) =>
                        this.#node.protocol.inspectPath({ endpointId, clusterId, commandId }),
                    )
                    .join(", ")}, suppressResponse=${suppressResponse}`,
        );

        if (interactionModelRevision > Specification.INTERACTION_MODEL_REVISION) {
            logger.debug(
                `Interaction model revision of sender ${interactionModelRevision} is higher than supported ${Specification.INTERACTION_MODEL_REVISION}.`,
            );
        }

        const receivedWithinTimedInteraction = exchange.hasActiveTimedInteraction();
        if (exchange.hasExpiredTimedInteraction()) {
            exchange.clearTimedInteraction(); // ??
            throw new StatusResponseError(`Timed request window expired. Decline invoke request.`, StatusCode.Timeout);
        }

        if (timedRequest !== exchange.hasTimedInteraction()) {
            throw new StatusResponseError(
                `timedRequest flag of invoke interaction (${timedRequest}) mismatch with expected timed interaction (${receivedWithinTimedInteraction}).`,
                StatusCode.TimedRequestMismatch,
            );
        }

        if (receivedWithinTimedInteraction) {
            logger.debug(`Invoke request from ${exchange.channel.name} received while timed interaction is running.`);
            exchange.clearTimedInteraction();
            if (message.packetHeader.sessionType !== SessionType.Unicast) {
                throw new StatusResponseError(
                    "Invoke requests are only allowed on unicast sessions when a timed interaction is running.",
                    StatusCode.InvalidAction,
                );
            }
        }

        if (invokeRequests.length > this.#maxPathsPerInvoke) {
            throw new StatusResponseError(
                `Only ${this.#maxPathsPerInvoke} invoke requests are supported in one message. This message contains ${invokeRequests.length}`,
                StatusCode.InvalidAction,
            );
        }

        const isGroupSession = message.packetHeader.sessionType === SessionType.Group;
        const invokeResponseMessage: TypeFromSchema<typeof TlvInvokeResponseForSend> = {
            suppressResponse: false, // Deprecated but must be present
            interactionModelRevision: Specification.INTERACTION_MODEL_REVISION,
            invokeResponses: [],
            moreChunkedMessages: invokeRequests.length > 1, // Assume for now we have multiple responses when having multiple invokes
        };
        const emptyInvokeResponseBytes = TlvInvokeResponseForSend.encode(invokeResponseMessage);
        let messageSize = emptyInvokeResponseBytes.length;
        let invokeResultsProcessed = 0;

        // To lower potential latency when we would process all invoke messages and just send responses at the end we
        // assemble response on the fly locally here and send when message becomes too big
        // TODO generalize as streaming like DataReports
        const processResponseResult = async (
            invokeResponse: TypeFromSchema<typeof TlvInvokeResponseData>,
        ): Promise<void> => {
            invokeResultsProcessed++;

            if (isGroupSession) {
                // We send no responses at all for group sessions
                return;
            }
            const encodedInvokeResponse = TlvInvokeResponseData.encodeTlv(invokeResponse);
            const invokeResponseBytes = TlvAny.getEncodedByteLength(encodedInvokeResponse);

            if (
                messageSize + invokeResponseBytes > exchange.maxPayloadSize ||
                invokeResultsProcessed === invokeRequests.length
            ) {
                let lastMessageProcessed = false;
                if (messageSize + invokeResponseBytes <= exchange.maxPayloadSize) {
                    // last invoke response and matches in the message
                    invokeResponseMessage.invokeResponses.push(encodedInvokeResponse);
                    lastMessageProcessed = true;
                }
                // Send the response when the message is full or when all responses are processed
                if (invokeResponseMessage.invokeResponses.length > 0) {
                    if (invokeRequests.length > 1) {
                        logger.debug(
                            `Send ${lastMessageProcessed ? "final " : ""}invoke response for ${invokeResponseMessage.invokeResponses.length} commands`,
                        );
                    }
                    const moreChunkedMessages = lastMessageProcessed ? undefined : true;
                    await messenger.send(
                        MessageType.InvokeResponse,
                        TlvInvokeResponseForSend.encode({
                            ...invokeResponseMessage,
                            moreChunkedMessages,
                        }),
                        {
                            logContext: {
                                invokeMsgFlags: Diagnostic.asFlags({
                                    suppressResponse,
                                    moreChunkedMessages,
                                }),
                            },
                        },
                    );
                    invokeResponseMessage.invokeResponses = [];
                    messageSize = emptyInvokeResponseBytes.length;
                }
                if (!lastMessageProcessed) {
                    invokeResultsProcessed--; // Correct counter again because we recall the method
                    return processResponseResult(invokeResponse);
                }
            } else {
                invokeResponseMessage.invokeResponses.push(encodedInvokeResponse);
                messageSize += invokeResponseBytes;
            }
        };

        for await (const chunk of this.#serverInteraction.invoke(
            request,
            this.#prepareOnlineContext(exchange, message, undefined, receivedWithinTimedInteraction),
        )) {
            if (suppressResponse) {
                throw new InternalError("Received response that should be suppressed for invoke");
            }
            for (const data of chunk) {
                switch (data.kind) {
                    case "cmd-response": {
                        const { path: commandPath, commandRef, data: commandFields } = data;
                        await processResponseResult({
                            command: {
                                commandPath,
                                commandFields,
                                commandRef,
                            },
                        });
                        break;
                    }

                    case "cmd-status": {
                        const { path, commandRef, status, clusterStatus } = data;
                        await processResponseResult({
                            status: { commandPath: path, status: { status, clusterStatus }, commandRef },
                        });
                    }
                }
            }
        }
    }

    handleTimedRequest(exchange: MessageExchange, { timeout, interactionModelRevision }: TimedRequest) {
        logger.debug(`Received timed request (${timeout}ms) from ${exchange.channel.name}`);

        if (interactionModelRevision > Specification.INTERACTION_MODEL_REVISION) {
            logger.debug(
                `Interaction model revision of sender ${interactionModelRevision} is higher than supported ${Specification.INTERACTION_MODEL_REVISION}.`,
            );
        }

        exchange.startTimedInteraction(timeout);
    }

    async close() {
        this.#isClosing = true;
    }
}

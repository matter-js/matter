/**
 * @license
 * Copyright 2022-2024 Matter.js Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
    Channel,
    Crypto,
    ImplementationError,
    Logger,
    MatterError,
    MatterFlowError,
    NotImplementedError,
    TransportInterface,
    UdpInterface,
} from "#general";
import { NodeId } from "#types";
import { Message, MessageCodec, SessionType } from "../codec/MessageCodec.js";
import { Fabric } from "../fabric/Fabric.js";
import { INTERACTION_PROTOCOL_ID } from "../interaction/InteractionServer.js";
import { SECURE_CHANNEL_PROTOCOL_ID, SecureMessageType } from "../securechannel/SecureChannelMessages.js";
import { SecureChannelMessenger } from "../securechannel/SecureChannelMessenger.js";
import { SecureSession } from "../session/SecureSession.js";
import { Session } from "../session/Session.js";
import { SessionManager, UNICAST_UNSECURE_SESSION_ID } from "../session/SessionManager.js";
import { ChannelManager } from "./ChannelManager.js";
import { MessageExchange } from "./MessageExchange.js";
import { DuplicateMessageError } from "./MessageReceptionState.js";
import { ProtocolHandler } from "./ProtocolHandler.js";

const logger = Logger.get("ExchangeManager");

export class ChannelNotConnectedError extends MatterError {}

export class MessageChannel implements Channel<Message> {
    public closed = false;
    #closeCallback?: () => Promise<void>;

    constructor(
        readonly channel: Channel<Uint8Array>,
        readonly session: Session,
        closeCallback?: () => Promise<void>,
    ) {
        this.#closeCallback = closeCallback;
    }

    set closeCallback(callback: () => Promise<void>) {
        this.#closeCallback = callback;
    }

    /** Is the underlying transport reliable? */
    get isReliable() {
        return this.channel.isReliable;
    }

    get type() {
        return this.channel.type;
    }

    /**
     * Max Payload size of the exchange which bases on the maximum payload size of the channel. The full encoded matter
     * message payload sent here can be as huge as allowed by the channel.
     */
    get maxPayloadSize() {
        return this.channel.maxPayloadSize;
    }

    send(message: Message): Promise<void> {
        logger.debug("Message »", MessageCodec.messageDiagnostics(message));
        const packet = this.session.encode(message);
        const bytes = MessageCodec.encodePacket(packet);
        if (bytes.length > this.maxPayloadSize) {
            logger.warn(
                `Matter message to send to ${this.name} is ${bytes.length}bytes long, which is larger than the maximum allowed size of ${this.maxPayloadSize}. This only works if both nodes support it.`,
            );
        }

        return this.channel.send(bytes);
    }

    get name() {
        return `${this.channel.name} on session ${this.session.name}`;
    }

    async close() {
        const wasAlreadyClosed = this.closed;
        this.closed = true;
        await this.channel.close();
        if (!wasAlreadyClosed) {
            await this.#closeCallback?.();
        }
    }
}

export class ExchangeManager {
    private readonly exchangeCounter = new ExchangeCounter();
    private readonly exchanges = new Map<number, MessageExchange>();
    private readonly protocols = new Map<number, ProtocolHandler>();
    private readonly transportListeners = new Array<TransportInterface.Listener>();
    private readonly closingSessions = new Set<number>();

    constructor(
        private readonly sessionManager: SessionManager,
        private readonly channelManager: ChannelManager,
    ) {}

    addTransportInterface(netInterface: TransportInterface) {
        const udpInterface = netInterface instanceof UdpInterface;
        this.transportListeners.push(
            netInterface.onData((socket, data) => {
                if (udpInterface && data.length > socket.maxPayloadSize) {
                    logger.warn(
                        `Ignoring UDP message with size ${data.length} from ${socket.name}, which is larger than the maximum allowed size of ${socket.maxPayloadSize}.`,
                    );
                    return;
                }

                try {
                    this.onMessage(socket, data).catch(error => logger.error(error));
                } catch (error) {
                    logger.warn("Ignoring UDP message with error", error);
                }
            }),
        );
    }

    hasProtocolHandler(protocolId: number) {
        return this.protocols.has(protocolId);
    }

    getProtocolHandler(protocolId: number) {
        return this.protocols.get(protocolId);
    }

    addProtocolHandler(protocol: ProtocolHandler) {
        if (this.hasProtocolHandler(protocol.getId())) {
            throw new ImplementationError(`Handler for protocol ${protocol.getId()} already registered.`);
        }
        this.protocols.set(protocol.getId(), protocol);
    }

    initiateExchange(fabric: Fabric, nodeId: NodeId, protocolId: number) {
        return this.initiateExchangeWithChannel(this.channelManager.getChannel(fabric, nodeId), protocolId);
    }

    initiateExchangeWithChannel(channel: MessageChannel, protocolId: number) {
        const exchangeId = this.exchangeCounter.getIncrementedCounter();
        const exchangeIndex = exchangeId | 0x10000; // Ensure initiated and received exchange index are different, since the exchangeID can be the same
        const exchange = MessageExchange.initiate(channel, exchangeId, protocolId);
        this.#addExchange(exchangeIndex, exchange);
        return exchange;
    }

    async close() {
        for (const protocol of this.protocols.values()) {
            await protocol.close();
        }
        for (const netListener of this.transportListeners) {
            await netListener.close();
        }
        this.transportListeners.length = 0;
        for (const exchange of this.exchanges.values()) {
            await exchange.destroy();
        }
        this.exchanges.clear();
    }

    private async onMessage(channel: Channel<Uint8Array>, messageBytes: Uint8Array) {
        const packet = MessageCodec.decodePacket(messageBytes);

        if (packet.header.sessionType === SessionType.Group)
            throw new NotImplementedError("Group messages are not supported");

        let session: Session | undefined;
        if (packet.header.sessionType === SessionType.Unicast) {
            if (packet.header.sessionId === UNICAST_UNSECURE_SESSION_ID) {
                const initiatorNodeId = packet.header.sourceNodeId ?? NodeId.UNSPECIFIED_NODE_ID;
                session =
                    this.sessionManager.getUnsecureSession(initiatorNodeId) ??
                    this.sessionManager.createUnsecureSession({
                        initiatorNodeId,
                    });
            } else {
                session = this.sessionManager.getSession(packet.header.sessionId);
            }
        } else if (packet.header.sessionType === SessionType.Group) {
            if (packet.header.sourceNodeId !== undefined) {
                //session = this.sessionManager.findGroupSession(packet.header.destGroupId, packet.header.sessionId);
            }
            // if (packet.header.destGroupId !== undefined) { ???
        }

        if (session === undefined) {
            throw new MatterFlowError(
                `Cannot find a session for ID ${packet.header.sessionId}${
                    packet.header.sourceNodeId !== undefined ? ` and source NodeId ${packet.header.sourceNodeId}` : ""
                }`,
            );
        }

        const messageId = packet.header.messageId;

        let isDuplicate;
        try {
            session?.updateMessageCounter(packet.header.messageId, packet.header.sourceNodeId);
            isDuplicate = false;
        } catch (e) {
            DuplicateMessageError.accept(e);
            isDuplicate = true;
        }

        const aad = messageBytes.slice(0, messageBytes.length - packet.applicationPayload.length); // Header+Extensions
        const message = session.decode(packet, aad);
        const exchangeIndex = message.payloadHeader.isInitiatorMessage
            ? message.payloadHeader.exchangeId
            : message.payloadHeader.exchangeId | 0x10000;
        let exchange = this.exchanges.get(exchangeIndex);

        if (
            exchange !== undefined &&
            (exchange.session.id !== session.id || exchange.isInitiator === message.payloadHeader.isInitiatorMessage) // Should always be ok, but just in case
        ) {
            exchange = undefined;
        }

        if (exchange !== undefined) {
            await exchange.onMessageReceived(message, isDuplicate);
        } else {
            if (session.closingAfterExchangeFinished) {
                throw new MatterFlowError(
                    `Session with ID ${packet.header.sessionId} marked for closure, decline new exchange creation.`,
                );
            }

            const protocolHandler = this.protocols.get(message.payloadHeader.protocolId);

            if (protocolHandler !== undefined && message.payloadHeader.isInitiatorMessage && !isDuplicate) {
                if (
                    message.payloadHeader.messageType == SecureMessageType.StandaloneAck &&
                    !message.payloadHeader.requiresAck
                ) {
                    logger.debug(
                        `Ignoring unsolicited standalone ack message ${messageId} for protocol ${message.payloadHeader.protocolId} and exchange id ${message.payloadHeader.exchangeId}.`,
                    );
                    return;
                }

                const exchange = MessageExchange.fromInitialMessage(
                    await this.channelManager.getOrCreateChannel(channel, session),
                    message,
                );
                this.#addExchange(exchangeIndex, exchange);
                await exchange.onMessageReceived(message);
                await protocolHandler.onNewExchange(exchange, message);
            } else if (message.payloadHeader.requiresAck) {
                const exchange = MessageExchange.fromInitialMessage(
                    await this.channelManager.getOrCreateChannel(channel, session),
                    message,
                );
                this.#addExchange(exchangeIndex, exchange);
                await exchange.send(SecureMessageType.StandaloneAck, new Uint8Array(0), {
                    includeAcknowledgeMessageId: message.packetHeader.messageId,
                });
                await exchange.close();
                logger.debug(
                    `Ignoring unsolicited message ${messageId} for protocol ${message.payloadHeader.protocolId}.`,
                );
            } else {
                if (protocolHandler === undefined) {
                    throw new MatterFlowError(`Unsupported protocol ${message.payloadHeader.protocolId}`);
                }
                if (isDuplicate) {
                    logger.info(
                        `Ignoring duplicate message ${messageId} (requires no ack) for protocol ${message.payloadHeader.protocolId}.`,
                    );
                    return;
                } else {
                    logger.info(
                        `Discarding unexpected message ${messageId} for protocol ${
                            message.payloadHeader.protocolId
                        }, exchangeIndex ${exchangeIndex} and sessionId ${session.id} : ${Logger.toJSON(message)}`,
                    );
                }
            }

            // TODO A node SHOULD limit itself to a maximum of 5 concurrent exchanges over a unicast session. This is
            //  to prevent a node from exhausting the message counter window of the peer node.
        }
    }

    async deleteExchange(exchangeIndex: number) {
        const exchange = this.exchanges.get(exchangeIndex);
        if (exchange === undefined) {
            logger.info(`Exchange with index ${exchangeIndex} to delete not found or already deleted.`);
            return;
        }
        const { session } = exchange;
        if (session.isSecure && session.closingAfterExchangeFinished) {
            logger.debug(
                `Exchange index ${exchangeIndex} Session ${session.name} is already marked for closure. Close session now.`,
            );
            try {
                await this.closeSession(session as SecureSession);
            } catch (error) {
                logger.error(`Error closing session ${session.name}. Ignoring.`, error);
            }
        }
        this.exchanges.delete(exchangeIndex);
    }

    async closeSession(session: SecureSession) {
        const sessionId = session.id;
        const sessionName = session.name;
        if (this.sessionManager.getSession(sessionId) === undefined) {
            // Session already removed, so we do not need to close again
            return;
        }
        if (this.closingSessions.has(sessionId)) {
            return;
        }
        this.closingSessions.add(sessionId);
        for (const [_exchangeIndex, exchange] of this.exchanges.entries()) {
            if (exchange.session.id === sessionId) {
                await exchange.destroy();
            }
        }
        if (session.sendCloseMessageWhenClosing) {
            const channel = this.channelManager.getChannelForSession(session);
            logger.debug(`Channel for session ${session.name} is ${channel?.name}`);
            if (channel !== undefined) {
                const exchange = this.initiateExchangeWithChannel(channel, SECURE_CHANNEL_PROTOCOL_ID);
                logger.debug(`Initiated exchange ${!!exchange} to close session ${sessionName}`);
                if (exchange !== undefined) {
                    try {
                        const messenger = new SecureChannelMessenger(exchange);
                        await messenger.sendCloseSession();
                        await messenger.close();
                    } catch (error) {
                        if (error instanceof ChannelNotConnectedError) {
                            logger.debug("Session already closed because channel is disconnected.");
                        } else {
                            logger.error("Error closing session", error);
                        }
                    }
                }
                await exchange.destroy();
            }
        }
        if (session.closingAfterExchangeFinished) {
            await session.destroy(false, false);
        }
        this.sessionManager.removeSession(sessionId);
        this.closingSessions.delete(sessionId);
    }

    #addExchange(exchangeIndex: number, exchange: MessageExchange) {
        exchange.closed.on(() => this.deleteExchange(exchangeIndex));
        this.exchanges.set(exchangeIndex, exchange);
    }
}

export class ExchangeCounter {
    private exchangeCounter = Crypto.getRandomUInt16();

    getIncrementedCounter() {
        this.exchangeCounter++;
        if (this.exchangeCounter > 0xffff) {
            this.exchangeCounter = 0;
        }
        return this.exchangeCounter;
    }
}

export class ExchangeProvider {
    constructor(
        private readonly exchangeManager: ExchangeManager,
        private channel: MessageChannel,
        private readonly reconnectChannelFunc?: () => Promise<MessageChannel>,
    ) {}

    hasProtocolHandler(protocolId: number) {
        return this.exchangeManager.hasProtocolHandler(protocolId);
    }

    getProtocolHandler(protocolId: number) {
        return this.exchangeManager.getProtocolHandler(protocolId);
    }

    addProtocolHandler(handler: ProtocolHandler) {
        this.exchangeManager.addProtocolHandler(handler);
    }

    initiateExchange(): MessageExchange {
        return this.exchangeManager.initiateExchangeWithChannel(this.channel, INTERACTION_PROTOCOL_ID);
    }

    async reconnectChannel() {
        if (this.reconnectChannelFunc === undefined) return false;
        this.channel = await this.reconnectChannelFunc();
        return true;
    }

    get session() {
        return this.channel.session;
    }

    get channelType() {
        return this.channel.type;
    }
}

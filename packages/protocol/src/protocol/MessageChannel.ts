import { Message, MessageCodec } from "#codec/index.js";
import { Channel, Logger, MatterFlowError } from "#general";
import { DEFAULT_EXPECTED_PROCESSING_TIME_MS, ExchangeLogContext } from "#protocol/MessageExchange.js";
import { Session, SessionParameters } from "#session/index.js";

const logger = new Logger("MessageChannel");

/**
 * The buffer time in milliseconds to add to the peer response time to also consider network delays and other factors.
 * TODO: This is a pure guess and should be adjusted in the future.
 */
const PEER_RESPONSE_TIME_BUFFER_MS = 5_000;

export namespace MRP {
    /**
     * The maximum number of transmission attempts for a given reliable message. The sender MAY choose this value as it
     * sees fit.
     */
    export const MAX_TRANSMISSIONS = 5;

    /** The base number for the exponential backoff equation. */
    export const BACKOFF_BASE = 1.6;

    /** The scaler for random jitter in the backoff equation. */
    export const BACKOFF_JITTER = 0.25;

    /** The scaler margin increase to backoff over the peer sleepy interval. */
    export const BACKOFF_MARGIN = 1.1;

    /** The number of retransmissions before transitioning from linear to exponential backoff. */
    export const BACKOFF_THRESHOLD = 1;

    /** @see {@link MatterSpecification.v12.Core}, section 4.11.8 */
    export const STANDALONE_ACK_TIMEOUT_MS = 200;
}

export class MessageChannel implements Channel<Message> {
    public closed = false;
    #closeCallback?: () => Promise<void>;
    // When the session is supporting MRP and the channel is not reliable, use MRP handling

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

    get usesMrp() {
        return this.session.supportsMRP && !this.channel.isReliable;
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

    async send(message: Message, logContext?: ExchangeLogContext) {
        logger.debug("Message »", MessageCodec.messageDiagnostics(message, logContext));
        const packet = this.session.encode(message);
        const bytes = MessageCodec.encodePacket(packet);
        if (bytes.length > this.maxPayloadSize) {
            logger.warn(
                `Matter message to send to ${this.name} is ${bytes.length}bytes long, which is larger than the maximum allowed size of ${this.maxPayloadSize}. This only works if both nodes support it.`,
            );
        }

        return await this.channel.send(bytes);
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

    calculateMaximumPeerResponseTimeMs(
        sessionParameters: SessionParameters,
        expectedProcessingTimeMs = DEFAULT_EXPECTED_PROCESSING_TIME_MS,
    ) {
        switch (this.channel.type) {
            case "tcp":
                // TCP uses 30s timeout according to chip sdk implementation, so do the same
                return 30_000 + PEER_RESPONSE_TIME_BUFFER_MS;
            case "udp":
                // UDP normally uses MRP, if not we have Group communication, which normally have no responses
                if (!this.usesMrp) {
                    throw new MatterFlowError("No response expected for this message exchange because UDP and no MRP.");
                }
                return (
                    this.#calculateMrpMaximumPeerResponseTime(sessionParameters, expectedProcessingTimeMs) +
                    PEER_RESPONSE_TIME_BUFFER_MS
                );
            case "ble":
                // chip sdk uses BTP_ACK_TIMEOUT_MS which is wrong in my eyes, so we use static 30s as like TCP here
                return 30_000 + PEER_RESPONSE_TIME_BUFFER_MS;
            default:
                throw new MatterFlowError(
                    `Can not calculate expected timeout for unknown channel type: ${this.channel.type}`,
                );
        }
    }

    /**
     * Calculates the backoff time for a resubmission based on the current retransmission count.
     * If no session parameters are provided, the parameters of the current session are used.
     * If session parameters are provided, the method can be used to calculate the maximum backoff time for the other
     * side of the exchange.
     *
     * @see {@link MatterSpecification.v10.Core}, section 4.11.2.1
     */
    getMrpResubmissionBackOffTime(retransmissionCount: number, sessionParameters?: SessionParameters) {
        const { activeIntervalMs, idleIntervalMs } = sessionParameters ?? this.session.parameters;
        const baseInterval =
            sessionParameters !== undefined || this.session.isPeerActive() ? activeIntervalMs : idleIntervalMs;
        return Math.floor(
            MRP.BACKOFF_MARGIN *
                baseInterval *
                Math.pow(MRP.BACKOFF_BASE, Math.max(0, retransmissionCount - MRP.BACKOFF_THRESHOLD)) *
                (1 + (sessionParameters !== undefined ? 1 : Math.random()) * MRP.BACKOFF_JITTER),
        );
    }

    #calculateMrpMaximumPeerResponseTime(
        sessionParameters: SessionParameters,
        expectedProcessingTimeMs = DEFAULT_EXPECTED_PROCESSING_TIME_MS,
    ) {
        // We use the expected processing time and deduct the time we already waited since last resubmission
        let finalWaitTime = expectedProcessingTimeMs;

        // and then add the time the other side needs for a full resubmission cycle under the assumption we are active
        for (let i = 0; i < MRP.MAX_TRANSMISSIONS; i++) {
            finalWaitTime += this.getMrpResubmissionBackOffTime(i, sessionParameters);
        }

        // TODO: Also add any network latency buffer, for now lets consider it's included in the processing time already
        return finalWaitTime;
    }
}

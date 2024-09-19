/**
 * @license
 * Copyright 2022-2024 Matter.js Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
    Bytes,
    CRYPTO_SYMMETRIC_KEY_LENGTH,
    Crypto,
    DataWriter,
    Diagnostic,
    Endian,
    Logger,
    MatterFlowError,
} from "#general";
import { CaseAuthenticatedTag, NodeId, StatusCode, StatusResponseError } from "#types";
import { DecodedMessage, DecodedPacket, Message, MessageCodec, Packet } from "../codec/MessageCodec.js";
import { Fabric } from "../fabric/Fabric.js";
import { SubscriptionHandler } from "../interaction/SubscriptionHandler.js";
import { MessageCounter } from "../protocol/MessageCounter.js";
import { MessageReceptionStateEncryptedWithoutRollover } from "../protocol/MessageReceptionState.js";
import { Session, SessionContext, SessionParameterOptions } from "./Session.js";

const logger = Logger.get("SecureSession");

const SESSION_KEYS_INFO = Bytes.fromString("SessionKeys");
const SESSION_RESUMPTION_KEYS_INFO = Bytes.fromString("SessionResumptionKeys");

export class NoAssociatedFabricError extends StatusResponseError {
    constructor(message: string) {
        super(message, StatusCode.UnsupportedAccess);
    }
}

export class SecureSession extends Session {
    readonly #subscriptions = new Array<SubscriptionHandler>();
    #closingAfterExchangeFinished = false;
    #sendCloseMessageWhenClosing = true;
    readonly #context: SessionContext;
    readonly #id: number;
    #fabric: Fabric | undefined;
    readonly #peerNodeId: NodeId;
    readonly #peerSessionId: number;
    readonly #decryptKey: Uint8Array;
    readonly #encryptKey: Uint8Array;
    readonly #attestationKey: Uint8Array;
    readonly #subscriptionChangedCallback: () => void;
    #caseAuthenticatedTags: CaseAuthenticatedTag[];
    readonly supportsMRP = true;

    static async create<T extends SessionContext>(args: {
        context: T;
        id: number;
        fabric: Fabric | undefined;
        peerNodeId: NodeId;
        peerSessionId: number;
        sharedSecret: Uint8Array;
        salt: Uint8Array;
        isInitiator: boolean;
        isResumption: boolean;
        closeCallback: () => Promise<void>;
        subscriptionChangedCallback?: () => void;
        peerSessionParameters?: SessionParameterOptions;
        caseAuthenticatedTags?: CaseAuthenticatedTag[];
    }) {
        const {
            context,
            id,
            fabric,
            peerNodeId,
            peerSessionId,
            sharedSecret,
            salt,
            isInitiator,
            isResumption,
            closeCallback,
            peerSessionParameters,
            caseAuthenticatedTags,
            subscriptionChangedCallback,
        } = args;
        const keys = await Crypto.hkdf(
            sharedSecret,
            salt,
            isResumption ? SESSION_RESUMPTION_KEYS_INFO : SESSION_KEYS_INFO,
            CRYPTO_SYMMETRIC_KEY_LENGTH * 3,
        );
        const decryptKey = isInitiator ? keys.slice(16, 32) : keys.slice(0, 16);
        const encryptKey = isInitiator ? keys.slice(0, 16) : keys.slice(16, 32);
        const attestationKey = keys.slice(32, 48);
        return new SecureSession({
            context,
            id,
            fabric,
            peerNodeId,
            peerSessionId,
            decryptKey,
            encryptKey,
            attestationKey,
            closeCallback,
            subscriptionChangedCallback,
            sessionParameters: peerSessionParameters,
            isInitiator,
            caseAuthenticatedTags,
        });
    }

    constructor(args: {
        context: SessionContext;
        id: number;
        fabric: Fabric | undefined;
        peerNodeId: NodeId;
        peerSessionId: number;
        decryptKey: Uint8Array;
        encryptKey: Uint8Array;
        attestationKey: Uint8Array;
        closeCallback: () => Promise<void>;
        subscriptionChangedCallback?: () => void;
        sessionParameters?: SessionParameterOptions;
        caseAuthenticatedTags?: CaseAuthenticatedTag[];
        isInitiator: boolean;
    }) {
        super({
            ...args,
            setActiveTimestamp: true, // We always set the active timestamp for Secure sessions
            // Can be changed to a PersistedMessageCounter if we implement session storage
            messageCounter: new MessageCounter(() => {
                // Secure Session Message Counter
                // Expire/End the session before the counter rolls over
                this.end(true, true).catch(error => logger.error(`Error while closing session: ${error}`));
            }),
            messageReceptionState: new MessageReceptionStateEncryptedWithoutRollover(),
        });
        const {
            context,
            id,
            fabric,
            peerNodeId,
            peerSessionId,
            decryptKey,
            encryptKey,
            attestationKey,
            subscriptionChangedCallback = () => {},
            caseAuthenticatedTags,
        } = args;

        this.#context = context;
        this.#id = id;
        this.#fabric = fabric;
        this.#peerNodeId = peerNodeId;
        this.#peerSessionId = peerSessionId;
        this.#decryptKey = decryptKey;
        this.#encryptKey = encryptKey;
        this.#attestationKey = attestationKey;
        this.#subscriptionChangedCallback = subscriptionChangedCallback;
        this.#caseAuthenticatedTags = caseAuthenticatedTags ?? [];

        fabric?.addSession(this);

        logger.debug(
            `Created secure ${this.isPase ? "PASE" : "CASE"} session for fabric index ${fabric?.fabricIndex}`,
            this.name,
            Diagnostic.dict({
                idleIntervalMs: this.idleIntervalMs,
                activeIntervalMs: this.activeIntervalMs,
                activeThresholdMs: this.activeThresholdMs,
                dataModelRevision: this.dataModelRevision,
                interactionModelRevision: this.interactionModelRevision,
                specificationVersion: this.specificationVersion,
                maxPathsPerInvoke: this.maxPathsPerInvoke,
            }),
        );
    }

    get caseAuthenticatedTags() {
        return this.#caseAuthenticatedTags;
    }

    get closingAfterExchangeFinished() {
        return this.#closingAfterExchangeFinished;
    }

    get sendCloseMessageWhenClosing() {
        return this.#sendCloseMessageWhenClosing;
    }

    get isSecure(): boolean {
        return true;
    }

    get isPase(): boolean {
        return this.#peerNodeId === NodeId.UNSPECIFIED_NODE_ID;
    }

    async close(closeAfterExchangeFinished?: boolean) {
        if (closeAfterExchangeFinished === undefined) {
            closeAfterExchangeFinished = this.isPeerActive(); // We delay session close if the peer is actively communicating with us
        }
        await this.end(true, closeAfterExchangeFinished);
    }

    decode({ header, applicationPayload, messageExtension }: DecodedPacket, aad: Uint8Array): DecodedMessage {
        if (header.hasMessageExtensions) {
            logger.info(
                `Message extensions are not supported. Ignoring ${messageExtension ? Bytes.toHex(messageExtension) : undefined}`,
            );
        }
        const nonce = this.generateNonce(header.securityFlags, header.messageId, this.#peerNodeId);
        const message = MessageCodec.decodePayload({
            header,
            applicationPayload: Crypto.decrypt(this.#decryptKey, applicationPayload, nonce, aad),
        });

        if (message.payloadHeader.hasSecuredExtension) {
            logger.info(
                `Secured extensions are not supported. Ignoring ${message.securityExtension ? Bytes.toHex(message.securityExtension) : undefined}`,
            );
        }

        return message;
    }

    encode(message: Message): Packet {
        message.packetHeader.sessionId = this.#peerSessionId;
        const { header, applicationPayload } = MessageCodec.encodePayload(message);
        const headerBytes = MessageCodec.encodePacketHeader(message.packetHeader);
        const securityFlags = headerBytes[3];
        const sessionNodeId = this.isPase
            ? NodeId.UNSPECIFIED_NODE_ID
            : (this.#fabric?.nodeId ?? NodeId.UNSPECIFIED_NODE_ID);
        const nonce = this.generateNonce(securityFlags, header.messageId, sessionNodeId);
        return { header, applicationPayload: Crypto.encrypt(this.#encryptKey, applicationPayload, nonce, headerBytes) };
    }

    get attestationChallengeKey(): Uint8Array {
        return this.#attestationKey;
    }

    get fabric() {
        return this.#fabric;
    }

    addAssociatedFabric(fabric: Fabric) {
        if (this.#fabric !== undefined) {
            throw new MatterFlowError("Session already has an associated Fabric. Cannot change this.");
        }
        this.#fabric = fabric;
    }

    get id() {
        return this.#id;
    }

    get name() {
        return `secure/${this.#id}`;
    }

    get context() {
        return this.#context;
    }

    get peerSessionId(): number {
        return this.#peerSessionId;
    }

    get nodeId() {
        return this.#fabric?.nodeId ?? NodeId.UNSPECIFIED_NODE_ID;
    }

    get peerNodeId() {
        return this.#peerNodeId;
    }

    get numberOfActiveSubscriptions() {
        return this.#subscriptions.length;
    }

    get associatedFabric(): Fabric {
        if (this.#fabric === undefined) {
            throw new NoAssociatedFabricError(
                `${this.isPase ? "PASE " : ""}Session needs to have an associated Fabric for fabric sensitive data handling.`,
            );
        }
        return this.#fabric;
    }

    addSubscription(subscription: SubscriptionHandler) {
        this.#subscriptions.push(subscription);
        logger.debug(`Added subscription ${subscription.subscriptionId} to ${this.name}`);
        this.#subscriptionChangedCallback();
    }

    removeSubscription(subscriptionId: number) {
        const index = this.#subscriptions.findIndex(subscription => subscription.subscriptionId === subscriptionId);
        if (index !== -1) {
            this.#subscriptions.splice(index, 1);
            logger.debug(`Removed subscription ${subscriptionId} from ${this.name}`);
            this.#subscriptionChangedCallback();
        }
    }

    async clearSubscriptions(flushSubscriptions = false) {
        const subscriptions = [...this.#subscriptions]; // get all values because subscriptions will remove themselves when cancelled
        for (const subscription of subscriptions) {
            await subscription.cancel(flushSubscriptions);
        }
        this.#subscriptions.length = 0;
    }

    /** Ends a session. Outstanding subscription data will be flushed before the session is destroyed. */
    async end(sendClose: boolean, closeAfterExchangeFinished = false) {
        await this.clearSubscriptions(true);
        await this.destroy(sendClose, closeAfterExchangeFinished);
    }

    /** Destroys a session. Outstanding subscription data will be discarded. */
    async destroy(sendClose = false, closeAfterExchangeFinished = true) {
        await this.clearSubscriptions(false);
        this.#fabric?.removeSession(this);
        if (!sendClose) {
            this.#sendCloseMessageWhenClosing = false;
        }

        if (closeAfterExchangeFinished) {
            logger.info(`Register Session ${this.name} to send a close when exchange is ended.`);
            this.#closingAfterExchangeFinished = true;
        } else {
            await this.closeCallback();
        }
    }

    private generateNonce(securityFlags: number, messageId: number, nodeId: NodeId) {
        const writer = new DataWriter(Endian.Little);
        writer.writeUInt8(securityFlags);
        writer.writeUInt32(messageId);
        writer.writeUInt64(nodeId);
        return writer.toByteArray();
    }
}

export function assertSecureSession(session?: Session, errorText?: string): asserts session is SecureSession {
    if (!session?.isSecure) {
        throw new MatterFlowError(errorText ?? "Insecure session in secure context");
    }
}

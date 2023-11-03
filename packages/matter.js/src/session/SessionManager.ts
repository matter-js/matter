/**
 * @license
 * Copyright 2022-2023 Project CHIP Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MatterFlowError } from "../common/MatterError.js";
import { Crypto } from "../crypto/Crypto.js";
import { FabricId } from "../datatype/FabricId.js";
import { NodeId } from "../datatype/NodeId.js";
import { Fabric } from "../fabric/Fabric.js";
import { Logger } from "../log/Logger.js";
import { StorageContext } from "../storage/StorageContext.js";
import { ByteArray } from "../util/ByteArray.js";
import { SecureSession } from "./SecureSession.js";
import { Session } from "./Session.js";
import { UnsecureSession } from "./UnsecureSession.js";

const logger = Logger.get("SessionManager");

export const UNDEFINED_NODE_ID = NodeId(0);

export const UNICAST_UNSECURE_SESSION_ID = 0x0000;

export interface ResumptionRecord {
    sharedSecret: ByteArray;
    resumptionId: ByteArray;
    fabric: Fabric;
    peerNodeId: NodeId;
}

type ResumptionStorageRecord = {
    nodeId: NodeId;
    sharedSecret: Uint8Array;
    resumptionId: Uint8Array;
    fabricId: FabricId;
    peerNodeId: NodeId;
};

export class SessionManager<ContextT> {
    private readonly unsecureSession: UnsecureSession<ContextT>;
    private readonly sessions = new Map<number, Session<ContextT>>();
    private nextSessionId = Crypto.getRandomUInt16();
    private resumptionRecords = new Map<NodeId, ResumptionRecord>();
    private readonly sessionStorage: StorageContext;

    constructor(
        private readonly context: ContextT,
        storage: StorageContext,
    ) {
        this.sessionStorage = storage.createContext("SessionManager");
        this.unsecureSession = new UnsecureSession(context);
        this.sessions.set(UNICAST_UNSECURE_SESSION_ID, this.unsecureSession);
    }

    async createSecureSession(args: {
        sessionId: number;
        fabric: Fabric | undefined;
        peerNodeId: NodeId;
        peerSessionId: number;
        sharedSecret: ByteArray;
        salt: ByteArray;
        isInitiator: boolean;
        isResumption: boolean;
        idleRetransmissionTimeoutMs?: number;
        activeRetransmissionTimeoutMs?: number;
        closeCallback?: () => Promise<void>;
        subscriptionChangedCallback?: () => void;
    }) {
        const {
            sessionId,
            fabric,
            peerNodeId,
            peerSessionId,
            sharedSecret,
            salt,
            isInitiator,
            isResumption,
            idleRetransmissionTimeoutMs,
            activeRetransmissionTimeoutMs,
            closeCallback,
            subscriptionChangedCallback,
        } = args;
        const session = await SecureSession.create({
            context: this.context,
            id: sessionId,
            fabric,
            peerNodeId,
            peerSessionId,
            sharedSecret,
            salt,
            isInitiator,
            isResumption,
            closeCallback: async () => {
                logger.info(`Remove Session ${session.name} from session manager.`);
                await closeCallback?.();
                this.sessions.delete(sessionId);
            },
            idleRetransmissionTimeoutMs,
            activeRetransmissionTimeoutMs,
            subscriptionChangedCallback: () => subscriptionChangedCallback?.(),
        });
        this.sessions.set(sessionId, session);

        // TODO: Add a maximum of sessions and respect/close the "least recently used" session. See Core Specs 4.10.1.1
        return session;
    }

    removeSession(sessionId: number) {
        this.sessions.delete(sessionId);
    }

    removeResumptionRecord(peerNodeId: NodeId) {
        this.resumptionRecords.delete(peerNodeId);
        this.storeResumptionRecords();
    }

    getNextAvailableSessionId() {
        while (true) {
            if (this.sessions.has(this.nextSessionId)) {
                this.nextSessionId = (this.nextSessionId + 1) & 0xffff;
                if (this.nextSessionId === 0) this.nextSessionId++;
                continue;
            }
            return this.nextSessionId++;
        }
    }

    getSession(sessionId: number) {
        return this.sessions.get(sessionId);
    }

    getPaseSession() {
        return [...this.sessions.values()].find(
            session => session.isSecure() && session.isPase() && !session.closingAfterExchangeFinished,
        ) as SecureSession<ContextT>;
    }

    getSessionForNode(fabric: Fabric, nodeId: NodeId) {
        //TODO: It can have multiple sessions for one node ...
        return [...this.sessions.values()].find(session => {
            if (!session.isSecure()) return false;
            const secureSession = session as SecureSession<any>;
            return secureSession.getFabric()?.fabricId === fabric.fabricId && secureSession.getPeerNodeId() === nodeId;
        });
    }

    async removeAllSessionsForNode(nodeId: NodeId, sendClose = false) {
        for (const session of this.sessions.values()) {
            if (!session.isSecure()) continue;
            const secureSession = session as SecureSession<any>;
            if (secureSession.getPeerNodeId() === nodeId) {
                await secureSession.destroy(sendClose, false);
            }
        }
    }

    getUnsecureSession() {
        return this.unsecureSession;
    }

    findResumptionRecordById(resumptionId: ByteArray) {
        return [...this.resumptionRecords.values()].find(record => record.resumptionId.equals(resumptionId));
    }

    findResumptionRecordByNodeId(nodeId: NodeId) {
        return this.resumptionRecords.get(nodeId);
    }

    saveResumptionRecord(resumptionRecord: ResumptionRecord) {
        this.resumptionRecords.set(resumptionRecord.peerNodeId, resumptionRecord);
        this.storeResumptionRecords();
    }

    updateFabricForResumptionRecords(fabric: Fabric) {
        const record = this.resumptionRecords.get(fabric.rootNodeId);
        if (record === undefined) {
            throw new MatterFlowError("Resumption record not found. Should never happen.");
        }
        this.resumptionRecords.set(fabric.rootNodeId, { ...record, fabric });
        this.storeResumptionRecords();
    }

    storeResumptionRecords() {
        this.sessionStorage.set<ResumptionStorageRecord[]>(
            "resumptionRecords",
            [...this.resumptionRecords].map(([nodeId, { sharedSecret, resumptionId, peerNodeId, fabric }]) => ({
                nodeId,
                sharedSecret,
                resumptionId,
                fabricId: fabric.fabricId,
                peerNodeId: peerNodeId,
            })),
        );
    }

    initFromStorage(fabrics: Fabric[]) {
        const storedResumptionRecords = this.sessionStorage.get<ResumptionStorageRecord[]>("resumptionRecords", []);

        storedResumptionRecords.forEach(({ nodeId, sharedSecret, resumptionId, fabricId, peerNodeId }) => {
            logger.info("restoring resumption record for node", nodeId);
            const fabric = fabrics.find(fabric => fabric.fabricId === fabricId);
            if (!fabric) {
                logger.error("fabric not found for resumption record", fabricId);
                return;
            }
            this.resumptionRecords.set(nodeId, {
                sharedSecret,
                resumptionId,
                fabric,
                peerNodeId,
            });
        });
    }

    getActiveSessionInformation() {
        return [...this.sessions.values()]
            .filter(session => session.isSecure() && !session.isPase())
            .map(session => ({
                name: session.name,
                nodeId: session.getNodeId(),
                peerNodeId: session.getPeerNodeId(),
                fabric: session instanceof SecureSession ? session.getFabric()?.getExternalInformation() : undefined,
                isPeerActive: session.isPeerActive(),
                secure: session.isSecure(),
                lastInteractionTimestamp: session instanceof SecureSession ? session.timestamp : undefined,
                lastActiveTimestamp: session instanceof SecureSession ? session.activeTimestamp : undefined,
                numberOfActiveSubscriptions: session instanceof SecureSession ? session.numberOfActiveSubscriptions : 0,
            }));
    }

    async close() {
        this.storeResumptionRecords();
        for (const sessionId of this.sessions.keys()) {
            if (sessionId === UNICAST_UNSECURE_SESSION_ID) continue;
            const session = this.sessions.get(sessionId);
            await session?.end(false);
            this.sessions.delete(sessionId);
        }
    }
}

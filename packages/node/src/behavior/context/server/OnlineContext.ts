/**
 * @license
 * Copyright 2022-2025 Matter.js Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AccessControlServer } from "#behaviors/access-control";
import { Agent } from "#endpoint/Agent.js";
import { Endpoint } from "#endpoint/Endpoint.js";
import { EndpointType } from "#endpoint/type/EndpointType.js";
import { Diagnostic, ImplementationError, InternalError, MaybePromise, Transaction } from "#general";
import { AccessLevel } from "#model";
import { Node } from "#node/Node.js";
import type { Message, NodeProtocol, SecureSession } from "#protocol";
import { AccessControl, AclEndpointContext, assertSecureSession, MessageExchange } from "#protocol";
import { FabricIndex, NodeId, SubjectId } from "#types";
import { ActionContext } from "../ActionContext.js";
import { Contextual } from "../Contextual.js";
import { NodeActivity } from "../NodeActivity.js";
import { ContextAgents } from "./ContextAgents.js";

/**
 * Operate in online context.  Public Matter API interactions happen in online context.
 */
export function OnlineContext(options: OnlineContext.Options) {
    let fabric: FabricIndex | undefined;
    let subject: SubjectId;
    let nodeProtocol: NodeProtocol | undefined;
    let accessLevelCache: Map<AccessControl.Location, number[]> | undefined;

    const { exchange } = options;
    const session = exchange?.session;

    if (session) {
        assertSecureSession(session);
        fabric = session.fabric?.fabricIndex;

        // TODO - group subject
        subject = session.peerNodeId;
    } else {
        fabric = options.fabric;
        subject = options.subject as NodeId;
    }

    if (subject === undefined) {
        throw new ImplementationError("OnlineContext requires an authorized subject");
    }

    const { message } = options;
    const via = Diagnostic.via(
        `online#${message?.packetHeader?.messageId?.toString(16) ?? "?"}@${subject.toString(16)}`,
    );

    return {
        /**
         * Run an actor with a read/write context.
         *
         * If the actor changes state, this may return a promise even if {@link actor} does not return a promise.
         */
        act<T>(actor: (context: ActionContext) => MaybePromise<T>): MaybePromise<T> {
            const context = this.open();

            let result;
            try {
                result = actor(context);
            } catch (e) {
                return context.reject(e);
            }

            return context.resolve(result);
        },

        /**
         * Create an online context.
         *
         * This context operates with a {@link Transaction} created via {@link Transaction.open} and the same rules
         * apply for lifecycle management using {@link Transaction.Finalization}.
         */
        open(): ActionContext & Transaction.Finalization {
            let close;
            let tx;
            try {
                close = initialize();
                tx = Transaction.open(via);
                tx.onClose(close);
            } catch (e) {
                close?.();
                throw e;
            }

            return createContext(tx, {
                resolve: tx.resolve.bind(tx),
                reject: tx.reject.bind(tx),
            }) as ActionContext & Transaction.Finalization;
        },

        /**
         * Begin an operation with a read-only context.
         *
         * A read-only context offers simpler lifecycle semantics than a r/w OnlineContext but you must still close the
         * context after use to properly deregister activity.
         */
        beginReadOnly() {
            const close = initialize();

            return createContext(Transaction.open(via, "snapshot"), {
                [Symbol.dispose]: close,
            }) as OnlineContext.ReadOnly;
        },

        [Symbol.toStringTag]: "OnlineContext",
    };

    /**
     * Initialization stage one - initialize everything common to r/o and r/w contexts
     */
    function initialize() {
        const activity = options.activity?.frame(via);

        const close = () => {
            if (message) {
                Contextual.setContextOf(message, undefined);
            }
            if (activity) {
                activity[Symbol.dispose]();
            }
        };

        return close;
    }

    /**
     * Initialization stage two - create context object after obtaining transaction
     */
    function createContext(transaction: Transaction, methods: {}) {
        let agents: undefined | ContextAgents;
        const context: ActionContext = {
            ...options,
            session: session as SecureSession | undefined,
            exchange,
            subject,
            fabric,
            transaction,

            interactionComplete: exchange?.closed,

            ...methods,

            // TODO - Matter 1.4 - add support for ARLs
            authorityAt(desiredAccessLevel: AccessLevel, location?: AccessControl.Location) {
                if (location === undefined) {
                    throw new InternalError("AccessControl.Location is required");
                }

                // We already checked access levels in this transaction, so reuse it
                const cachedAccessLevels = accessLevelCache?.get(location);
                if (cachedAccessLevels !== undefined) {
                    return cachedAccessLevels.includes(desiredAccessLevel)
                        ? AccessControl.Authority.Granted
                        : AccessControl.Authority.Unauthorized;
                }

                if (options.node === undefined) {
                    throw new InternalError("OnlineContext initialized without node");
                }

                const accessControl = options.node.act(agent => agent.get(AccessControlServer));
                if (MaybePromise.is(accessControl)) {
                    throw new InternalError("AccessControlServer should already be initialized.");
                }
                const accessLevels = accessControl.accessLevelsFor(context, location, aclEndpointContextFor(location));

                if (accessLevelCache === undefined) {
                    accessLevelCache = new Map();
                }
                accessLevelCache.set(location, accessLevels);

                return accessLevels.includes(desiredAccessLevel)
                    ? AccessControl.Authority.Granted
                    : AccessControl.Authority.Unauthorized;
            },

            agentFor<T extends EndpointType>(endpoint: Endpoint<T>): Agent.Instance<T> {
                if (!agents) {
                    agents = ContextAgents(context);
                }
                return agents.agentFor(endpoint);
            },

            get [Contextual.context](): ActionContext {
                return this;
            },
        };

        if (message) {
            Contextual.setContextOf(message, context);
        }

        return context;
    }

    /**
     * Access endpoint metadata required for access control.
     */
    function aclEndpointContextFor({ endpoint: number }: AccessControl.Location): AclEndpointContext {
        if (number === undefined) {
            throw new InternalError("Online location missing required endpoint number");
        }

        if (options.node === undefined) {
            throw new InternalError("Online context has no node defined");
        }

        if (nodeProtocol === undefined) {
            nodeProtocol = options.node.protocol;
        }

        const endpoint = nodeProtocol[number];
        if (endpoint !== undefined) {
            return endpoint;
        }

        // For non-existent endpoints create a fallback structure to still do basic endpoint-based ACL checks
        return {
            id: number,
            deviceTypes: [],
        };
    }
}

export namespace OnlineContext {
    export type Options = {
        node: Node;
        activity?: NodeActivity.Activity;
        command?: boolean;
        timed?: boolean;
        fabricFiltered?: boolean;
        message?: Message;
    } & (
        | { exchange: MessageExchange; fabric?: undefined; subject?: undefined }
        | { exchange?: undefined; fabric: FabricIndex; subject: SubjectId }
    );

    export interface ReadOnly extends ActionContext {
        [Symbol.dispose](): void;
    }
}

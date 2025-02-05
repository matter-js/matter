/**
 * @license
 * Copyright 2022-2025 Matter.js Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AccessControl } from "#behavior/AccessControl.js";
import { ActionContext } from "#behavior/context/ActionContext.js";
import { ActionTracer } from "#behavior/context/ActionTracer.js";
import { NodeActivity } from "#behavior/context/NodeActivity.js";
import { OfflineContext } from "#behavior/context/server/OfflineContext.js";
import { OnlineContext } from "#behavior/context/server/OnlineContext.js";
import { AccessControlCluster } from "#clusters/access-control";
import { Endpoint } from "#endpoint/Endpoint.js";
import { EndpointLifecycle } from "#endpoint/properties/EndpointLifecycle.js";
import { EndpointServer } from "#endpoint/server/EndpointServer.js";
import { Diagnostic, InternalError, Logger, MaybePromise } from "#general";
import {
    AccessDeniedError,
    AclEndpointContext,
    AnyAttributeServer,
    AnyEventServer,
    AttributePath,
    AttributeServer,
    CommandPath,
    CommandServer,
    EndpointInterface,
    EventPath,
    ExchangeManager,
    InteractionContext,
    InteractionEndpointStructure,
    InteractionServer,
    InteractionServerMessenger,
    Message,
    MessageExchange,
    SessionManager,
    WriteRequest,
    WriteResponse,
} from "#protocol";
import { EndpointNumber, StatusCode, StatusResponseError, TlvEventFilter, TypeFromSchema } from "#types";
import { AccessControlServer } from "../../behaviors/access-control/AccessControlServer.js";
import { ServerNode } from "../ServerNode.js";

const logger = Logger.get("TransactionalInteractionServer");

const activityKey = Symbol("activity");

interface WithActivity {
    [activityKey]?: NodeActivity.Activity;
}

const AclClusterId = AccessControlCluster.id;
const AclAttributeId = AccessControlCluster.attributes.acl.id;

/**
 * Wire up an InteractionServer that initializes an InvocationContext earlier than the cluster API supports.
 *
 * This is necessary for attributes because the ClusterServer attribute APIs are synchronous while transaction
 * management is asynchronous.
 *
 * It's not necessary for command handling because that API is entirely async.  We do it here, however, just for the
 * sake of consistency.
 *
 * This could be integrated directly into InteractionServer but this further refactoring is probably warranted there
 * regardless.  This keeps the touch light for now.
 */
export class TransactionalInteractionServer extends InteractionServer {
    #endpointStructure: InteractionEndpointStructure;
    #changeListener: (type: EndpointLifecycle.Change, endpoint: Endpoint) => void;
    #endpoint: Endpoint<ServerNode.RootEndpoint>;
    #activity: NodeActivity;
    #newActivityBlocked = false;
    #aclServer?: AccessControlServer;
    #aclUpdateIsDelayedInExchange = new Set<MessageExchange>();
    #endpointContexts = new Map<number, AclEndpointContext>();

    static async create(endpoint: Endpoint<ServerNode.RootEndpoint>, sessions: SessionManager) {
        const structure = new InteractionEndpointStructure();

        return new TransactionalInteractionServer(endpoint, {
            sessions,
            structure,
            subscriptionOptions: endpoint.state.network.subscriptionOptions,
            maxPathsPerInvoke: endpoint.state.basicInformation.maxPathsPerInvoke,
            initiateExchange: (address, protocolId) =>
                endpoint.env.get(ExchangeManager).initiateExchange(address, protocolId),
        });
    }

    constructor(endpoint: Endpoint<ServerNode.RootEndpoint>, context: InteractionContext) {
        super(context);

        const { structure } = context;

        this.#activity = endpoint.env.get(NodeActivity);

        this.#endpoint = endpoint;
        this.#endpointStructure = structure;

        // TODO - rewrite element lookup so we don't need to build the secondary endpoint structure cache
        this.#updateStructure();
        this.#changeListener = (type, endpoint) => {
            switch (type) {
                case EndpointLifecycle.Change.ServersChanged:
                    EndpointServer.forEndpoint(endpoint).updateServers();
                    this.#updateStructure();
                    break;

                case EndpointLifecycle.Change.PartsReady:
                case EndpointLifecycle.Change.ClientsChanged:
                case EndpointLifecycle.Change.Destroyed:
                    this.#updateStructure();
                    break;
            }
        };

        endpoint.lifecycle.changed.on(this.#changeListener);
    }

    async [Symbol.asyncDispose]() {
        this.#endpoint.lifecycle.changed.off(this.#changeListener);
        await this.close();
        this.#endpointStructure.close();
        await EndpointServer.forEndpoint(this.#endpoint)[Symbol.asyncDispose]();
    }

    blockNewActivity() {
        this.#newActivityBlocked = true;
    }

    override async onNewExchange(exchange: MessageExchange) {
        // When closing, ignore anything newly incoming
        if (this.#newActivityBlocked || this.isClosing) {
            return;
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
        const aclServer = this.#endpoint.act(agent => agent.get(AccessControlServer));
        if (MaybePromise.is(aclServer)) {
            throw new InternalError("AccessControlServer should already be initialized.");
        }
        return (this.#aclServer = aclServer);
    }

    /**
     * Gets the context information from an endpoint needed for ACL checks. It prefills a cache if needed.
     * The cache is cleared on structural changes and initialized again on next need.
     * TODO Remove with the legacy API
     */
    #getAclEndpointContext(endpointId: EndpointNumber) {
        if (!this.#endpointContexts.has(endpointId)) {
            this.#endpoint.visit(({ number, state }) => {
                if (number !== undefined && !this.#endpointContexts.has(number)) {
                    this.#endpointContexts.set(number, {
                        number,
                        deviceTypes: state.descriptor.deviceTypeList.map(({ deviceType }) => deviceType),
                    });
                }
            });
        }
        const context = this.#endpointContexts.get(endpointId);
        if (context) {
            return context;
        } else {
            throw new StatusResponseError(
                "Endpoint not found for ACL check. This should never happen.",
                StatusCode.UnsupportedEndpoint,
            );
        }
    }

    protected override readAttribute(
        path: AttributePath,
        attribute: AnyAttributeServer<any>,
        exchange: MessageExchange,
        fabricFiltered: boolean,
        message: Message,
        offline = false,
    ) {
        const readAttribute = () => super.readAttribute(path, attribute, exchange, fabricFiltered, message, offline);

        const endpoint = this.#endpointStructure.getEndpoint(path.endpointId);
        if (!endpoint) {
            throw new InternalError("Endpoint not found for ACL check. This should never happen.");
        }

        const result = offline
            ? OfflineContext.act("offline-read", this.#activity, readAttribute)
            : OnlineContext({
                  activity: (exchange as WithActivity)[activityKey],
                  fabricFiltered,
                  message,
                  exchange,
                  tracer: this.#tracer,
                  actionType: ActionTracer.ActionType.Read,
                  endpointContext: this.#getAclEndpointContext(path.endpointId),
                  root: this.#endpoint,
              }).act(readAttribute);

        if (MaybePromise.is(result)) {
            throw new InternalError("Reads should not return a promise.");
        }
        return result;
    }

    /**
     * Reads the attributes for the given endpoint.
     * This can currently only be used for subscriptions because errors are ignored!
     */
    protected override readEndpointAttributesForSubscription(
        endpointId: EndpointNumber,
        attributes: { path: AttributePath; attribute: AnyAttributeServer<any> }[],
        exchange: MessageExchange,
        fabricFiltered: boolean,
        message: Message,
        offline = false,
    ) {
        const readAttributes = () => {
            const result = new Array<{
                path: AttributePath;
                attribute: AnyAttributeServer<unknown>;
                value: any;
                version: number;
            }>();
            for (const { path, attribute } of attributes) {
                try {
                    const value = super.readAttribute(path, attribute, exchange, fabricFiltered, message, offline);
                    result.push({ path, attribute, value: value.value, version: value.version });
                } catch (error) {
                    if (StatusResponseError.is(error, StatusCode.UnsupportedAccess)) {
                        logger.warn(
                            `Permission denied reading attribute ${this.#endpointStructure.resolveAttributeName(path)}`,
                        );
                    } else {
                        logger.warn(
                            `Error reading attribute ${this.#endpointStructure.resolveAttributeName(path)}:`,
                            error,
                        );
                    }
                }
            }
            return result;
        };

        const result = offline
            ? OfflineContext.act("offline-read", this.#activity, readAttributes)
            : OnlineContext({
                  activity: (exchange as WithActivity)[activityKey],
                  fabricFiltered,
                  message,
                  exchange,
                  tracer: this.#tracer,
                  actionType: ActionTracer.ActionType.Read,
                  endpointContext: this.#getAclEndpointContext(endpointId),
                  root: this.#endpoint,
              }).act(readAttributes);
        if (MaybePromise.is(result)) {
            throw new InternalError("Online read should not return a promise.");
        }
        return result;
    }

    protected override async readEvent(
        path: EventPath,
        eventFilters: TypeFromSchema<typeof TlvEventFilter>[] | undefined,
        event: AnyEventServer<any, any>,
        exchange: MessageExchange,
        fabricFiltered: boolean,
        message: Message,
    ) {
        const readEvent = (context: ActionContext) => {
            if (!context.authorizedFor(event.readAcl, { cluster: path.clusterId } as AccessControl.Location)) {
                throw new AccessDeniedError(
                    `Access to ${path.endpointId}/${Diagnostic.hex(path.clusterId)} denied on ${exchange.session.name}.`,
                );
            }
            return super.readEvent(path, eventFilters, event, exchange, fabricFiltered, message);
        };

        return OnlineContext({
            activity: (exchange as WithActivity)[activityKey],
            fabricFiltered,
            message,
            exchange,
            tracer: this.#tracer,
            actionType: ActionTracer.ActionType.Read,
            endpointContext: this.#getAclEndpointContext(path.endpointId),
            root: this.#endpoint,
        }).act(readEvent);
    }

    override async handleWriteRequest(
        exchange: MessageExchange,
        writeRequest: WriteRequest,
        message: Message,
    ): Promise<WriteResponse> {
        let result: WriteResponse;
        try {
            result = await super.handleWriteRequest(exchange, writeRequest, message);
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

        return result;
    }

    protected override async writeAttribute(
        path: AttributePath,
        attribute: AttributeServer<any>,
        value: any,
        exchange: MessageExchange,
        message: Message,
        endpoint: EndpointInterface,
        timed = false,
        isListWrite?: boolean,
    ) {
        const writeAttribute = () =>
            super.writeAttribute(path, attribute, value, exchange, message, endpoint, timed, isListWrite);

        if (path.endpointId === 0 && path.clusterId === AclClusterId && path.attributeId === AclAttributeId) {
            // This is a hack to prevent the ACL from updating while we are in the middle of a write transaction
            // and is needed because Acl should not become effective during writing of the ACL itself.
            this.aclServer.aclUpdateDelayed = true;
            this.#aclUpdateIsDelayedInExchange.add(exchange);
        } else {
            // Ok it seems that acl was written, but we now write another path, so we can update Acl attribute now
            if (this.#aclUpdateIsDelayedInExchange.has(exchange)) {
                this.#aclUpdateIsDelayedInExchange.delete(exchange);

                if (this.#aclUpdateIsDelayedInExchange.size === 0) {
                    this.aclServer.aclUpdateDelayed = false;
                } else {
                    logger.info("Multiple concurrent ACL writes, waiting for all to finish.");
                }
            }
        }

        return OnlineContext({
            activity: (exchange as WithActivity)[activityKey],
            timed,
            message,
            exchange,
            fabricFiltered: true,
            tracer: this.#tracer,
            actionType: ActionTracer.ActionType.Write,
            endpointContext: this.#getAclEndpointContext(path.endpointId),

            root: this.#endpoint,
        }).act(writeAttribute);
    }

    protected override async invokeCommand(
        path: CommandPath,
        command: CommandServer<any, any>,
        exchange: MessageExchange,
        commandFields: any,
        message: Message,
        endpoint: EndpointInterface,
        timed = false,
    ) {
        const invokeCommand = (context: ActionContext) => {
            if (!context.authorizedFor(command.invokeAcl, { cluster: path.clusterId } as AccessControl.Location)) {
                throw new AccessDeniedError(
                    `Access to ${endpoint.number}/${Diagnostic.hex(path.clusterId)} denied on ${exchange.session.name}.`,
                );
            }
            return super.invokeCommand(path, command, exchange, commandFields, message, endpoint, timed);
        };

        return OnlineContext({
            activity: (exchange as WithActivity)[activityKey],
            command: true,
            timed,
            message,
            exchange,
            tracer: this.#tracer,
            actionType: ActionTracer.ActionType.Invoke,
            endpointContext: this.#getAclEndpointContext(path.endpointId),
            root: this.#endpoint,
        }).act(invokeCommand);
    }

    get #tracer() {
        if (this.#endpoint.env.has(ActionTracer)) {
            return this.#endpoint.env.get(ActionTracer);
        }
    }

    #updateStructure() {
        if (this.#endpoint.lifecycle.isPartsReady) {
            const server = EndpointServer.forEndpoint(this.#endpoint);
            this.#endpointStructure.initializeFromEndpoint(server);

            this.#endpointContexts.clear();
        }
    }
}

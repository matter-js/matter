/**
 * @license
 * Copyright 2022-2023 Project CHIP Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ImplementationError } from "../common/MatterError.js";
import { Part } from "../endpoint/Part.js";
import { RootEndpoint } from "../endpoint/definitions/system/RootEndpoint.js";
import { PartLifecycle } from "../endpoint/part/PartLifecycle.js";
import { EndpointType } from "../endpoint/type/EndpointType.js";
import { Environment } from "../environment/Environment.js";
import { Diagnostic } from "../log/Diagnostic.js";
import { Logger } from "../log/Logger.js";
import { NodeLifecycle } from "./NodeLifecycle.js";

const logger = Logger.get("Node");

/**
 * A Matter Node.
 *
 * In Matter, a "node" is an individually addressable top-level network resource.
 */
export class Node<T extends RootEndpoint = RootEndpoint> extends Part<T> {
    #environment: Environment;

    constructor(config: Node.Configuration<T>) {
        const parentEnvironment = config.environment ?? Environment.default;

        if (config.id === undefined) {
            config.id = `node${parentEnvironment.vars.increment("node.nextFallbackId")}`;
        }

        super(config);

        // We create a local environment so nodes can offer node-specific services via the environment
        this.#environment = new Environment(config.id, parentEnvironment);

        if (this.lifecycle.hasNumber) {
            if (this.number !== 0) {
                throw new ImplementationError("The root endpoint ID must be 0");
            }
        } else {
            this.number = 0;
        }

        // We don't really get "installed" as we are the root part.  This informs the part it is ready for full
        // initialization
        this.lifecycle.change(PartLifecycle.Change.Installed);

        this.lifecycle.online.on(() => {
            this.statusUpdate("is online");
        });

        this.lifecycle.offline.on(() => {
            this.statusUpdate("is offline");
        });

        this.lifecycle.changed.on((type, part) => {
            if (type === PartLifecycle.Change.Crashed) {
                this.partCrashed(part);
            }
        });
    }

    override get env() {
        return this.#environment;
    }

    /**
     * Lifecycle information.
     */
    override createLifecycle(): NodeLifecycle {
        return new NodeLifecycle(this);
    }

    /**
     * Starts the node and resolve when the node enters his online state. Use `cancel()` to stop the node.
     */
    async bringOnline() {
        const runtime = this.env.runtime;

        runtime.addWorker(this);

        await this.lifecycle.online;
    }

    /**
     * Run the node in standalone mode and resolve when the node goes offline again.
     *
     * If you are implementing a single node and all logic is handled by registered change handlers and cluster
     * implementations this is the most convenient way to bring it online.
     */
    async run() {
        const runtime = this.env.runtime;

        runtime.addWorker(this);

        await runtime.inactive;
    }

    override get lifecycle(): NodeLifecycle {
        // We only have to override the lifecycle getter so
        return super.lifecycle as NodeLifecycle;
    }

    protected statusUpdate(message: string) {
        logger.notice(Diagnostic.strong(this.toString()), message);
    }

    protected partCrashed(part: Part) {
        return this.lifecycle.partError.emit(part, part.construction.error ?? new Error("Unknown error"));
    }
}

export namespace Node {
    export interface NodeOptions extends Part.PartOptions {
        environment?: Environment;
    }

    export type Options<T extends RootEndpoint = RootEndpoint> = Part.Options<T, NodeOptions>;

    export type Configuration<T extends RootEndpoint = RootEndpoint> = Part.Configuration<T, NodeOptions>;

    export function nodeConfigFor<T extends RootEndpoint>(
        defaultType: T,
        configuration: undefined | T | Configuration<T>,
        options?: Options<T>,
    ): Node.Configuration<T> {
        if (!options) {
            options = {};
        }
        if (configuration === undefined) {
            return {
                type: defaultType,
                ...options,
            };
        }
        if ((configuration as EndpointType).deviceType !== undefined) {
            return {
                type: configuration as T,
                ...options,
            };
        }
        return {
            type: defaultType,
            ...configuration,
        } as Part.Configuration<T>;
    }
}

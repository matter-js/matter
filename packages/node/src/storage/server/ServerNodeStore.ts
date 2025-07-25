/**
 * @license
 * Copyright 2022-2025 Matter.js Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Endpoint } from "#endpoint/Endpoint.js";
import {
    asyncNew,
    BlobStorageContext,
    Destructable,
    Diagnostic,
    Environment,
    ImplementationError,
    Logger,
    StorageManager,
    StorageService,
} from "#general";
import type { ServerNode } from "#node/ServerNode.js";
import { NodeStore } from "../NodeStore.js";
import { ClientNodeStores } from "../client/ClientNodeStores.js";
import { ServerEndpointStores } from "./ServerEndpointStores.js";

const logger = Logger.get("ServerNodeStore");

/**
 * {@link ServerNode} persistence.
 *
 * Each {@link ServerNode} has an instance of this store.
 */
export class ServerNodeStore extends NodeStore implements Destructable {
    #env: Environment;
    #nodeId: string;
    #location: string;
    #endpointStores: ServerEndpointStores;
    #storageManager?: StorageManager;
    #clientStores?: ClientNodeStores;
    #bdxStorageContext?: BlobStorageContext;

    constructor(environment: Environment, nodeId: string) {
        super({
            createContext: (name: string) => {
                if (!this.#storageManager) {
                    throw new ImplementationError(
                        `Cannot create storage context ${name} because store is not initialized`,
                    );
                }
                return this.#storageManager.createContext(name);
            },

            createBlobContext: (name: string) => {
                if (!this.#storageManager) {
                    throw new ImplementationError(
                        `Cannot create storage context ${name} because store is not initialized`,
                    );
                }
                return this.#storageManager.createBlobContext(name);
            },
        });

        this.#endpointStores = new ServerEndpointStores();

        this.#env = environment;
        this.#nodeId = nodeId;
        this.#location = this.#env.get(StorageService).location ?? "(unknown location)";

        this.construction.start();
    }

    static async create(environment: Environment, nodeId: string) {
        return await asyncNew(this, environment, nodeId);
    }

    async close() {
        await this.construction.close(async () => {
            await this.#clientStores?.close();
            await this.#storageManager?.close();
            this.#logChange("Closed");
        });
    }

    /**
     * Stores associated with server endpoints supported by this node.
     */
    get endpointStores() {
        return this.construction.assert("endpoint stores", this.#endpointStores);
    }

    /**
     * Stores associated with remote nodes known by this node.
     */
    get clientStores() {
        return this.construction.assert("client stores", this.#clientStores);
    }

    get bdxStore() {
        this.construction.assert("BDX storage context");
        if (this.#bdxStorageContext === undefined) {
            this.#bdxStorageContext = this.createBlobStorageContext("bdx");
        }
        return this.#bdxStorageContext;
    }

    #logChange(what: "Opened" | "Closed") {
        logger.info(what, Diagnostic.strong(this.#nodeId ?? "node"), "storage at", `${this.#location}/${this.#nodeId}`);
    }

    storeForEndpoint(endpoint: Endpoint) {
        return this.#endpointStores.storeForEndpoint(endpoint);
    }

    erase() {
        return this.#endpointStores.erase();
    }

    async load() {
        this.#storageManager = await this.#env.get(StorageService).open(this.#nodeId);
        this.#env.set(StorageManager, this.#storageManager);

        this.#clientStores = await asyncNew(ClientNodeStores, this.#storageManager.createContext("nodes"));

        const rootContext = this.storageFactory.createContext("root");
        await this.#endpointStores.load(rootContext);

        this.#logChange("Opened");
    }
}

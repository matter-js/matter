/**
 * @license
 * Copyright 2022-2024 Matter.js Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Logger } from "#general";
import { lstatSync, readdirSync } from "fs";
import { homedir } from "os";
import { resolve } from "path";
import { IntermediateModel } from "../common/intermediate-model.js";
import { DEFAULT_MATTER_VERSION, IndexDetail, identifyDocument } from "./doc-utils.js";
import { loadClusters } from "./load-clusters.js";
import { loadDevices } from "./load-devices.js";
import { loadNamespaces } from "./load-namespaces.js";
import { translateCluster } from "./translate-cluster.js";
import { translateDevice } from "./translate-device.js";
import { translateGlobal } from "./translate-global.js";
import { translateNamespace } from "./translate-namespace.js";

const logger = Logger.get("spec-file");

export interface LoadOptions {
    document?: string;
    version?: string;
    path?: string;
}
export class SpecFile {
    #index: IndexDetail;

    constructor(path: string) {
        this.#index = identifyDocument(path);
    }

    get path() {
        return this.#index.ref.path;
    }

    get version() {
        return this.#index.version;
    }

    ingestClusters(target: IntermediateModel) {
        if (!this.#index.hasClusters) {
            return;
        }

        for (const ref of loadClusters(this.#index.ref)) {
            logger.info(`translate ${ref.name} (${ref.xref.document} § ${ref.xref.section})`);
            Logger.nest(() => {
                if (ref.type === "cluster") {
                    target.add(...translateCluster(ref));
                } else {
                    target.add(...translateGlobal(ref));
                }
            });
        }
    }

    ingestDevices(target: IntermediateModel) {
        if (!this.#index.hasDevices) {
            return;
        }

        for (const deviceRef of loadDevices(this.#index.ref)) {
            logger.info(`translate ${deviceRef.name} (${deviceRef.xref.document} § ${deviceRef.xref.section})`);
            Logger.nest(() => target.add(...translateDevice(deviceRef)));
        }
    }

    ingestNamespaces(target: IntermediateModel) {
        if (!this.#index.hasNamespaces) {
            return;
        }

        for (const nsRef of loadNamespaces(this.#index.ref)) {
            logger.info(`translate ${nsRef.name} (${nsRef.xref.document} § ${nsRef.xref.section})`);
            Logger.nest(() => target.add(...translateNamespace(nsRef)));
        }
    }

    static *load(options: LoadOptions) {
        const path =
            options.path ??
            process.env.MATTER_SPECIFICATION_PATH ??
            resolve(homedir(), "Dropbox", "matter", options.version ?? DEFAULT_MATTER_VERSION);

        let indices: string[];

        if (lstatSync(path).isFile()) {
            indices = [path];
        } else {
            try {
                indices = readdirSync(path).filter(filename => filename.endsWith(".html"));
            } catch (e) {
                if ((e as { code?: string }).code === "ENOENT") {
                    throw new Error(`Path ${path} does not exist, do you need to set MATTER_SPECIFICATION_PATH?`);
                } else {
                    throw e;
                }
            }
        }

        if (!indices.length) {
            throw new Error(`No HTML files in ${path}`);
        }

        for (const index of indices) {
            const file = new SpecFile(resolve(path, index));
            if (options.document === undefined || file.#index.ref.xref.document === options.document) {
                yield file;
            }
        }
    }
}

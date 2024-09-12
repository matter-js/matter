/**
 * @license
 * Copyright 2022-2024 Matter.js Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Diagnostic, Logger } from "@project-chip/matter.js-general";
import { Specification } from "@project-chip/matter.js-model";
import { readFileSync } from "fs";
import { JSDOM } from "jsdom";
import { Str } from "./html-translators.js";
import { HtmlReference } from "./spec-types.js";

const logger = Logger.get("scan-index");

export const DEFAULT_MATTER_VERSION = Specification.REVISION;

// Parse the section ID and name from a heading element
export function parseHeading(e: HTMLElement | null) {
    if (!e) {
        return undefined;
    }

    const heading = Str(e)?.replace(/^chapter\s+/i, "");
    if (!heading) {
        return undefined;
    }

    const parsed = /^([\d.]+)\. (.+)$/.exec(heading);
    if (!parsed) {
        return;
    }

    return {
        section: parsed[1],
        name: parsed[2],
    };
}

export type IndexDetail = {
    ref: HtmlReference;
    version: string;
    hasClusters: boolean;
    hasDevices: boolean;
    hasNamespaces: boolean;
};

export function loadHtml(path: string) {
    const html = readFileSync(path);
    return new JSDOM(html).window.document;
}

// Read an index file to find the portions of the spec we care about
export function identifyDocument(path: string): IndexDetail {
    const source = loadHtml(path);
    const titleEl = source.querySelector("h1");
    if (!titleEl || !titleEl.textContent) {
        throw new Error(`Cannot find specification title in ${path}`);
    }

    let title = titleEl.textContent;

    let spec: Specification;
    let hasClusters = false;
    let hasDevices = false;
    let hasNamespaces = false;
    if (title.match(/matter specification/i)) {
        spec = Specification.Core;
        hasClusters = true;
    } else if (title.match(/application/i)) {
        spec = Specification.Cluster;
        hasClusters = true;
    } else if (title.match(/device/i)) {
        spec = Specification.Device;
        hasDevices = true;
    } else if (title.match(/namespaces/i)) {
        spec = Specification.Namespace;
        hasNamespaces = true;
    } else {
        throw new Error(`Matter specification name ${title} unrecognized in ${path}`);
    }

    let version;
    const titleAndVersion = title.split(/ version /i);
    if (titleAndVersion.length === 2 && titleAndVersion[1].match(/(?:\d\.)+/i)) {
        title = titleAndVersion[0];
        version = titleAndVersion[1];
    } else {
        const versionEl = titleEl.nextElementSibling;
        if (!versionEl || !versionEl.textContent || !versionEl.textContent.match(/version (?:\d\.)+/i)) {
            throw new Error(`No version found for ${title} in ${path}`);
        }
        version = versionEl.textContent.replace(/.*version ([\d.]+).*/i, "$1");
    }

    // Drop dotted elements except the first two.  To date these have represented trivial changes
    const versionParts = version.split(".");
    if (versionParts.length > 2) {
        version = versionParts.slice(0, 2).join(".");
    }

    logger.info("recognized", Diagnostic.dict({ doc: spec, version: version }));

    return {
        ref: {
            name: title,
            path,
            xref: {
                document: spec,
                section: "",
            },
        },
        version,
        hasClusters,
        hasDevices,
        hasNamespaces,
    };
}

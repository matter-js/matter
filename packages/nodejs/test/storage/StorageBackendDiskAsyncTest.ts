/**
 * @license
 * Copyright 2022-2024 Matter.js Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { StorageBackendDiskAsync } from "#storage/index.js";
import * as assert from "assert";
import { readFile, rm, stat } from "fs/promises";
import { tmpdir } from "os";
import { resolve } from "path";

const TEST_STORAGE_LOCATION = resolve(tmpdir(), "matterjs-test-storage-async");

const CONTEXTx1 = ["context"];
const CONTEXTx2 = [...CONTEXTx1, "subcontext"];
const CONTEXTx3 = [...CONTEXTx2, "subsubcontext"];

describe("StorageBackendDiskAsync", () => {
    let storage: StorageBackendDiskAsync;

    beforeEach(async () => {
        await rm(TEST_STORAGE_LOCATION, { recursive: true, force: true });

        storage = new StorageBackendDiskAsync(TEST_STORAGE_LOCATION);
        await storage.initialize();
    });

    it("write and read success", async () => {
        await storage.set(CONTEXTx1, "key", "value");

        const value = await storage.get(CONTEXTx1, "key");
        assert.equal(value, "value");
    });

    it("multi-write and read success", async () => {
        await storage.set(CONTEXTx1, { key: "value", key2: "value2" });

        const value = await storage.get(CONTEXTx1, "key");
        assert.equal(value, "value");
        const value2 = await storage.get(CONTEXTx1, "key2");
        assert.equal(value2, "value2");
    });

    it("multi-write and values read success", async () => {
        await storage.set(CONTEXTx1, { key: "value", key2: "value2" });

        const values = await storage.values(CONTEXTx1);
        assert.deepEqual(values, { key: "value", key2: "value2" });
    });

    it("write and delete success", async () => {
        await storage.set(CONTEXTx1, "key", "value");
        await storage.delete(CONTEXTx1, "key");

        const value = await storage.get(CONTEXTx1, "key");
        assert.equal(value, undefined);
    });

    it("write and clear success", async () => {
        await storage.set(CONTEXTx1, "key", "value");
        await storage.clear();

        const value = await storage.get(CONTEXTx1, "key");
        assert.equal(value, undefined);
    });

    it("write and read success with multiple context levels", async () => {
        await storage.set(CONTEXTx3, "key", "value");

        const value = await storage.get(CONTEXTx3, "key");
        assert.equal(value, "value");

        const dirStat = await stat(TEST_STORAGE_LOCATION);
        assert.ok(dirStat.isDirectory());
        const KeyFileStat = await stat(TEST_STORAGE_LOCATION + "/context.subcontext.subsubcontext.key");
        assert.ok(KeyFileStat.isFile());
        const keyContent = await readFile(TEST_STORAGE_LOCATION + "/context.subcontext.subsubcontext.key");
        assert.equal(keyContent.toString(), `"value"`);
    });

    it("return keys with storage values", async () => {
        await storage.set(CONTEXTx3, "key", "value");

        const value = await storage.keys(CONTEXTx3);
        expect(value).deep.equal(["key"]);
    });

    it("return keys with storage without subcontexts values", async () => {
        await storage.set(CONTEXTx2, "key", "value");
        await storage.set(CONTEXTx3, "key", "value");

        const value = await storage.keys(CONTEXTx2);
        expect(value).deep.equal(["key"]);
    });

    it("return contexts with subcontexts", async () => {
        await storage.set(CONTEXTx2, "key", "value");
        await storage.set(["context", "subcontext2"], "key", "value");
        await storage.set(CONTEXTx3, "key", "value");

        expect(await storage.contexts(CONTEXTx3)).deep.equal([]);
        expect(await storage.contexts(CONTEXTx2)).deep.equal(["subsubcontext"]);
        expect(await storage.contexts(CONTEXTx1)).deep.equal(["subcontext", "subcontext2"]);
        expect(await storage.contexts([])).deep.equal(CONTEXTx1);
    });

    it("clear all keys with multiple contextes", async () => {
        await storage.set(CONTEXTx1, "key1", "value");
        await storage.set(CONTEXTx2, "key2", "value");
        await storage.set(CONTEXTx3, "key3", "value");

        await storage.clearAll(CONTEXTx2);
        expect(await storage.keys(CONTEXTx1)).deep.equal(["key1"]);
        expect(await storage.keys(CONTEXTx2)).deep.equal([]);
        expect(await storage.keys(CONTEXTx3)).deep.equal([]);
    });

    it("Rejects with error when context is empty on set", async () => {
        await assert.rejects(
            async () => {
                await storage.set([""], "key", "value");
            },
            {
                message: "Context must not be an empty and not contain dots.",
            },
        );
    });

    it("Rejects with error when key is empty on set", async () => {
        await assert.rejects(
            async () => {
                await storage.set(CONTEXTx1, "", "value");
            },
            {
                message: "Key must not be an empty string.",
            },
        );
    });

    it("Rejects with error when context is empty on get", async () => {
        await assert.rejects(
            async () => {
                await storage.get([""], "key");
            },
            {
                message: "Context must not be an empty and not contain dots.",
            },
        );
    });

    it("Rejects with error when context is empty on get with subcontext", async () => {
        await assert.rejects(
            async () => {
                await storage.get(["ok", ""], "key");
            },
            {
                message: "Context must not be an empty and not contain dots.",
            },
        );
    });

    it("Rejects with error when key is empty on get", async () => {
        await assert.rejects(
            async () => {
                await storage.get(CONTEXTx1, "");
            },
            {
                message: "Key must not be an empty string.",
            },
        );
    });

    after(async () => {
        await rm(TEST_STORAGE_LOCATION, { recursive: true, force: true });
    });
});

/**
 * @license
 * Copyright 2022-2023 Project CHIP Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { StorageError } from "../../src/storage/Storage.js";
import { StorageBackendMemory } from "../../src/storage/StorageBackendMemory.js";

describe("StorageBackendMemory", () => {
    it("write and read success", () => {
        const storage = new StorageBackendMemory();

        storage.set(["context"], "key", "value");

        const value = storage.get(["context"], "key");
        expect(value).equal("value");
    });

    it("write and delete success", () => {
        const storage = new StorageBackendMemory();

        storage.set(["context"], "key", "value");
        storage.delete(["context"], "key");

        const value = storage.get(["context"], "key");
        expect(value).equal(undefined);
    });

    it("write and read success with multiple context levels", () => {
        const storage = new StorageBackendMemory();

        storage.set(["context", "subcontext", "subsubcontext"], "key", "value");

        const value = storage.get(["context", "subcontext", "subsubcontext"], "key");
        expect(value).equal("value");
    });

    it("return keys with storage values", () => {
        const storage = new StorageBackendMemory();

        storage.set(["context", "subcontext", "subsubcontext"], "key", "value");

        const value = storage.keys(["context", "subcontext", "subsubcontext"]);
        expect(value).deep.equal(["key"]);
    });

    it("clear all keys with multiple contextes", () => {
        const storage = new StorageBackendMemory();

        storage.set(["context"], "key1", "value");
        storage.set(["context", "subcontext"], "key2", "value");
        storage.set(["context", "subcontext", "subsubcontext"], "key3", "value");

        storage.clearAll(["context", "subcontext"]);
        expect(storage.keys(["context"])).deep.equal(["key1"]);
        expect(storage.keys(["context", "subcontext"])).deep.equal([]);
        expect(storage.keys(["context", "subcontext", "subsubcontext"])).deep.equal([]);
    });

    it("return keys with storage without subcontexts values", () => {
        const storage = new StorageBackendMemory();

        storage.set(["context", "subcontext"], "key", "value");
        storage.set(["context", "subcontext", "subsubcontext"], "key", "value");

        const value = storage.keys(["context", "subcontext"]);
        expect(value).deep.equal(["key"]);
    });

    it("Throws error when context is empty on set", () => {
        expect(() => {
            const storage = new StorageBackendMemory();
            storage.set([], "key", "value");
        }).throw(StorageError, "Context and key must not be empty.");
    });

    it("Throws error when context is empty on set", () => {
        expect(() => {
            const storage = new StorageBackendMemory();
            storage.set([""], "key", "value");
        }).throw(StorageError, "Context must not be an empty string.");
    });

    it("Throws error when key is empty on set", () => {
        expect(() => {
            const storage = new StorageBackendMemory();
            storage.set(["context"], "", "value");
        }).throw(StorageError, "Context and key must not be empty.");
    });

    it("Throws error when context is empty on get with subcontext", () => {
        expect(() => {
            const storage = new StorageBackendMemory();
            storage.get(["ok", ""], "key");
        }).throw(StorageError, "Context must not be an empty string.");
    });

    it("Throws error when key is empty on get", () => {
        expect(() => {
            const storage = new StorageBackendMemory();
            storage.get(["context", "subcontext"], "");
        }).throw(StorageError, "Context and key must not be empty.");
    });
});

/**
 * @license
 * Copyright 2022-2024 Matter.js Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Specification } from "../../src/model/index.js";
import { SpecificationVersion } from "../../src/schema/SpecificationVersionSchema.js";

describe("SpecificationVersionSchema", () => {
    it("encodes and decodes a specification version", () => {
        const version = { major: 1, minor: 2, patch: 3 };
        const encoded = SpecificationVersion.encode(version);

        expect(encoded).to.equal(0x01020300);

        const decoded = SpecificationVersion.decode(encoded);

        expect(decoded).to.deep.equal({ ...version, reserved: 0 });
    });

    it("decode our encoded version", () => {
        expect(SpecificationVersion.decode(Specification.SPECIFICATION_VERSION)).to.deep.equal({
            major: 1,
            minor: 3,
            patch: 0,
            reserved: 0,
        });
    });
});

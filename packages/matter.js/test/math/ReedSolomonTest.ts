/**
 * @license
 * Copyright 2022-2024 Matter.js Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Bytes } from "@project-chip/matter.js-general";
import { ReedSolomon } from "../../src/math/ReedSolomon.js";

describe("ReedSolomon", () => {
    describe("computeErrorCorrection", () => {
        it("computes the correct error correction bytes", () => {
            const result = new ReedSolomon().computeErrorCorrection(
                Bytes.fromHex("40d2754776173206272696c6c69670ec"),
                10,
            );

            expect(Bytes.toHex(result)).equal("bc2a90136bafeffd4be0");
        });
    });
});

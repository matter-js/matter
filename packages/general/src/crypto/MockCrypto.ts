/**
 * @license
 * Copyright 2022-2025 Matter.js Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ImplementationError } from "#MatterError.js";
import { Crypto, ec } from "./Crypto.js";
import { CurveType, Key, KeyType, PrivateKey } from "./Key.js";
import { StandardCrypto } from "./StandardCrypto.js";

/**
 * WARNING: ONLY FOR USE IN PROTECTED TESTING ENVIRONMENTS WHERE SECURITY IS NOT A CONCERN
 *
 * A {@link Crypto} with sources of entropy replaced to produce stable values based on an input index.
 *
 * This is useful in testing environments where Matter logic is difficult to test with true entropy.
 *
 * Depending on implementation some methods may need further mocking to remove entropy entirely.  Mocking is sufficient
 * for current testing purposes.
 */
export interface MockCrypto extends Crypto {
    /**
     * The index of the random space.  May be modified to adjust computations going forward.
     */
    index: number;
}

export function MockCrypto(index: number = 0x80, implementation: new () => Crypto = StandardCrypto) {
    if (index < 0 || index > 255) {
        throw new ImplementationError(`Index for stable crypto must be 0-255`);
    }

    const crypto = new implementation();

    // Create random data consisting of index repeated
    crypto.randomBytes = function getRandomDataNONENTROPIC(length) {
        const result = new Uint8Array(length);
        result.fill(index);
        return result;
    };

    // Ensure EC key generation uses our own "entropy" source rather than the platform's
    crypto.createKeyPair = function getRandomDataNONENTROPIC() {
        const privateBits = ec.mapHashToField(new Uint8Array(crypto.randomBytes(48)), ec.p256.CURVE.n);
        return Key({
            kty: KeyType.EC,
            crv: CurveType.p256,
            privateBits,
        }) as PrivateKey;
    };

    Object.defineProperty(crypto, "index", {
        get() {
            return index;
        },

        set(newIndex: number) {
            index = newIndex % 256;
        },
    });

    return crypto as MockCrypto;
}

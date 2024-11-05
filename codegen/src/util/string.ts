/**
 * @license
 * Copyright 2022-2024 Matter.js Authors
 * SPDX-License-Identifier: Apache-2.0
 */

export { camelize, describeList, serialize } from "#general";

/**
 * Returns a string formatted to function as an object key.  This means escaping as a string if it can't be a bare
 * identifier.
 */
export function asObjectKey(label: any) {
    let str = `${label}`;
    if (!str.match(/^[$_a-z][$_a-z0-9]*$/i)) {
        str = JSON.stringify(label);
    }
    return str;
}

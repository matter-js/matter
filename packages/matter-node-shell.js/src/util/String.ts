/**
 * @license
 * Copyright 2022-2023 Project CHIP Authors
 * SPDX-License-Identifier: Apache-2.0
 */

export function camelize(str: string) {
    return str.charAt(0).toLowerCase() + str.slice(1);
}

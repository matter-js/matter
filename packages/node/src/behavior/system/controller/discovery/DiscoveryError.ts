/**
 * @license
 * Copyright 2022-2025 Project CHIP Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MatterAggregateError, MatterError } from "#general";

export class DiscoveryError extends MatterError {
    static override [Symbol.hasInstance](instance: unknown) {
        if (instance instanceof DiscoveryAggregateError) {
            return true;
        }
        return super[Symbol.hasInstance](instance);
    }
}

export class DiscoveryAggregateError extends MatterAggregateError {}

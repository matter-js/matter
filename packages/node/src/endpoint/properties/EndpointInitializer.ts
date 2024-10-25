/**
 * @license
 * Copyright 2022-2024 Matter.js Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Behavior } from "#behavior/Behavior.js";
import { BehaviorBacking } from "#behavior/internal/BehaviorBacking.js";
import { Endpoint } from "../Endpoint.js";

/**
 * Base class for {@link Endpoint} initialization services.
 */
export abstract class EndpointInitializer {
    /**
     * Initialize a {@link Endpoint}.
     */
    initializeDescendant(_endpoint: Endpoint) {}

    /**
     * Create backing for a behavior of a descendent.
     *
     * @param endpoint the {@link Endpoint} the behavior belongs to
     * @param type the {@link Behavior} type
     * @returns a new {@link BehaviorBacking}
     */
    abstract createBacking(endpoint: Endpoint, behavior: Behavior.Type): BehaviorBacking;
}

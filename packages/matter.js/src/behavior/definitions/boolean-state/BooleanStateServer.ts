/**
 * @license
 * Copyright 2022-2024 Matter.js Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BooleanStateBehavior } from "./BooleanStateBehavior.js";

/**
 * This is the default server implementation of {@link BooleanStateBehavior}.
 */
export class BooleanStateServer extends BooleanStateBehavior {
    override initialize() {
        this.reactTo(this.events.stateValue$Change, this.#emitStateChange, { offline: true });
    }

    #emitStateChange(stateValue: boolean) {
        this.events.stateChange?.emit({ stateValue }, this.context);
    }
}

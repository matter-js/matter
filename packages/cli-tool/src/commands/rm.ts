/**
 * @license
 * Copyright 2022-2024 Matter.js Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Location } from "#location.js";
import { Command } from "./command.js";

Command({
    usage: "[PATH]...",
    description: "Deletes the properties at the paths you specify.",

    invoke: async function rm(...args: unknown[]) {
        const toDelete = Array<Location>();

        for (const path of args) {
            const location = await this.location.at(`${path}`);
            if (!location.parent) {
                this.err(`Invalid argument: Can't delete ${location.path}`);
                return;
            }
            toDelete.push(location);
        }

        for (const location of toDelete) {
            delete (location.parent!.definition as Record<string, unknown>)[location.basename];
        }
    },
});

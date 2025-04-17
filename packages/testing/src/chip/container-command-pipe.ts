/**
 * @license
 * Copyright 2022-2025 Matter.js Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BackchannelCommand } from "../device/backchannel.js";
import { Container } from "../docker/container.js";
import { Terminal } from "../docker/terminal.js";
import { CommandPipe } from "./command-pipe.js";

const FIFO_PATH = "/command-pipe.fifo";

/**
 * A command pipe that reads commands from a Docker container.
 */
export class ContainerCommandPipe extends CommandPipe {
    #container: Container;
    #deactivate?: () => void;
    #stopped?: Promise<void>;

    constructor(container: Container, subject: BackchannelCommand.Subject, appName: string) {
        super(subject, appName);
        this.#container = container;
    }

    override async initialize() {
        // Many test files are hard-coded to /tmp so we swap out temp files to preserve state when we switch test
        // agents.  This would overwrite our FIFO, however, so we symlink to the real FIFO to prevent it from being
        // overwritten
        await this.#container.createPipe(FIFO_PATH);
        await this.#container.exec(["ln", "-sf", "/command-pipe.fifo", this.filename]);

        this.#stopped = this.#processCommands();
    }

    override async close() {
        this.#deactivate?.();
        this.#deactivate = undefined;

        await this.#stopped;
        this.#stopped = undefined;
    }

    async #processCommands() {
        let terminal: Terminal<string> | undefined;
        try {
            terminal = await this.#container.follow(FIFO_PATH);

            const iterator = terminal[Symbol.asyncIterator]();

            while (true) {
                let deactivator;
                const deactivated = new Promise<void>(resolve => {
                    deactivator = this.#deactivate = resolve;
                });

                const iteration = iterator.next().then(result => result.value as undefined | string);

                try {
                    const line = await Promise.race([deactivated, iteration]);
                    if (line === undefined) {
                        break;
                    }

                    this.onData(line);
                } finally {
                    if (this.#deactivate === deactivator) {
                        this.#deactivate = undefined;
                    }
                }
            }
        } finally {
            if (terminal) {
                try {
                    await terminal.close();
                } catch (e) {
                    console.warn(`Error closing FIFO listener for ${this.filename}:`, e);
                }
            }

            try {
                await this.#container.delete(this.filename, { force: true });
            } catch (e) {
                console.warn(`Error deleting FIFO ${this.filename}:`, e);
            }
        }
    }
}

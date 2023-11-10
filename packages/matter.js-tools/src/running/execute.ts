/**
 * @license
 * Copyright 2022-2023 Project CHIP Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { spawn, SpawnOptions } from "child_process";
import { platform } from "os";

import colors from "ansi-colors";

export async function execute(bin: string, argv: string[]) {
    return new Promise<void>((resolve, reject) => {
        let finished = false;

        const options: SpawnOptions = {
            stdio: "inherit",
        };
        if (platform() === "win32") {
            options.shell = true;
        }

        const proc = spawn(bin, argv, options);

        proc.on("error", e => {
            finished = true;
            reject(e);
        });

        proc.on("close", code => {
            if (finished) {
                return;
            }
            finished = true;

            if (code === 0) {
                resolve();
            } else {
                reject(`Process ${bin} exited with code ${code}`);
            }
        });
    });
}

export async function executeNode(script: string, argv: string[]) {
    argv = ["--enable-source-maps", script, ...argv];
    if (process.env.MATTER_RUN_ECHO) {
        const command = colors.whiteBright(`node ${argv.join(" ")}`);
        process.stdout.write(`${colors.greenBright("Matter execute:")} ${command}\n`);
    }
    return execute("node", argv);
}

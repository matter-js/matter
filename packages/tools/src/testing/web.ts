/**
 * @license
 * Copyright 2022-2024 Matter.js Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { build } from "esbuild";
import express from "express";
import { writeFile } from "fs/promises";
import http from "http";
import { AddressInfo } from "net";
import { relative } from "path";
import { Browser, chromium, ConsoleMessage, Page } from "playwright";
import { Package } from "../util/package.js";
import { TestOptions } from "./options.js";
import { ConsoleProxyReporter, Reporter } from "./reporter.js";
import type { TestRunner } from "./runner.js";

export async function testWeb(runner: TestRunner, manual: boolean) {
    const files = runner.loadFiles("esm");
    const bundlePath = await bundle(files, runner.pkg);

    const server = await new Promise<http.Server>((resolve, reject) => {
        try {
            const server = express()
                .use(express.static(Package.workspace.resolve("node_modules")))
                .use(express.static(Package.workspace.path))
                .get("/", (_, res) => res.send(buildIndex(bundlePath)))
                .listen(0, "localhost", () => resolve(server));
        } catch (e) {
            reject(e);
        }
    });

    const addr = server.address() as AddressInfo;
    let ip = addr.address;
    if (ip.indexOf(":") !== -1) {
        ip = `[${ip}]`;
    }
    const url = `http://${ip}:${addr.port}/`;

    await new Promise<void>((resolve, reject) => {
        server.on("error", reject);
        server.on("close", resolve);

        if (manual) {
            console.log(`Run tests manually at ${url}`);
        } else {
            testInBrowser(url, runner.reporter, runner.options)
                .then(() => {
                    server.close(() => {
                        // Hmm the close event above doesn't fire
                        resolve();
                    });
                })
                .catch(error => {
                    reject(error);
                });
        }
    });
}

async function testInBrowser(url: string, reporter: Reporter, options: TestOptions) {
    async function setup() {
        const browser = await chromium.launch();
        const page = await browser.newPage();
        return { browser, page };
    }

    async function run({ browser, page }: { browser: Browser; page: Page }) {
        await page.goto(url);
        await page.evaluate(options => (globalThis as any).MatterTest.auto(options), options);
        await browser.close();
    }

    await new Promise<void>((resolve, reject) => {
        setup()
            .then(cx => {
                cx.page.on("console", consoleHandler(reporter));
                cx.page.on("pageerror", error => reject(error));
                return cx;
            })
            .then(run)
            .then(resolve)
            .catch(reject);
    });
}

function consoleHandler(reporter: Reporter) {
    return (message: ConsoleMessage) => {
        const type = message.type();
        switch (type) {
            case "log":
            case "debug":
            case "info":
            case "error":
            case "warn":
            case "trace":
                break;

            default:
                return;
        }

        const text = message.text();

        // If it's not an encoded reporter update, write to normal console
        if (type !== "log" || !text.startsWith(ConsoleProxyReporter.FLAG)) {
            console[type](text);
            return;
        }

        // Invoke reporter
        const args: string[] = JSON.parse(text.slice(ConsoleProxyReporter.FLAG.length));
        const method = (reporter as any)[args[0]];
        if (typeof method !== "function") {
            throw new Error(`Invalid encoded reporter update method ${args[0]}`);
        }
        method.call(reporter, ...args.slice(1));
    };
}

function buildIndex(bundlePath: string) {
    return `<!DOCTYPE html>
<html>
<head>
    <title>Matter.js Web Testing</title>
    <link rel="stylesheet" href="mocha/mocha.css">
</head>
<body>
    <div id="mocha"><h1><a href="javascript:MatterTest.start()">run tests</a></h1></div>
    <script src="mocha/mocha.js"></script>
    <script src="${bundlePath}" type="module"></script>
</body>
</html>`;
}

async function bundle(files: string[], pkg: Package) {
    const entrypointPath = pkg.resolve("build/esm/test-entrypoint.js");
    const bundlePath = pkg.resolve("build/cjs/test-bundle.js");

    const entrypoint = files
        .map(path => {
            path = relative(pkg.resolve("build/esm"), path).replace(/\\/g, "/");
            if (!path.startsWith(".")) {
                path = `./${path}`;
            }
            return `import ${JSON.stringify(path)}`;
        })
        .join("\n");

    // I was unable to get esbuild to resolve the entrypoint using the "stdin" and "absWorkingDir" options.  So we just
    // write to disk
    await writeFile(pkg.resolve("build/esm/test-entrypoint.js"), entrypoint);

    await build({
        entryPoints: [entrypointPath],
        bundle: true,
        format: "cjs",
        outfile: bundlePath,
        external: ["wtfnode"],
        keepNames: true,

        // This doesn't work...
        // logOverride: {
        //     "direct-eval": "silent",
        // },

        // ...so we do this:
        logLevel: "error",
    });

    return pkg.workspace.relative(bundlePath);
}

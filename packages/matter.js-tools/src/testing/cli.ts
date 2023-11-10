/**
 * @license
 * Copyright 2022-2023 Project CHIP Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { Project } from "../building/project.js";
import { TestRunner } from "./runner.js";

enum TestType {
    esm = "esm",
    cjs = "cjs",
    web = "web",
}

export async function main(argv = process.argv) {
    const testTypes = new Set<TestType>();

    let manual = false;

    const args = await yargs(hideBin(argv))
        .usage("Runs tests in packages adhering to matter.js standards.")
        .option("prefix", {
            alias: "p",
            default: ".",
            type: "string",
            describe: "specify directory of package to test",
        })
        .option("web", {
            alias: "w",
            default: false,
            type: "boolean",
            describe: "enable web tests in default test mode",
        })
        .option("spec", {
            type: "array",
            string: true,
            describe: "One or more paths of tests to run",
            default: "test/**/*Test.ts",
        })
        .option("fgrep", { alias: "f", type: "string", describe: "Only run tests matching this string" })
        .option("grep", { alias: "g", type: "string", describe: "Only run tests matching this regexp" })
        .option("invert", { alias: "i", type: "boolean", describe: "Inverts --grep and --fgrep matches" })
        .option("profile", { type: "boolean", describe: "Write profiling data to build/profiles (node only)" })
        .option("all-logs", { type: "boolean", describe: "Emit log messages in real time" })
        .option("force-exit", { type: "boolean", describe: "Force Node to exit after tests complete" })
        .command("*", "run all supported test types")
        .command("esm", "run tests on node (ES6 modules)", () => testTypes.add(TestType.esm))
        .command("cjs", "run tests on node (CommonJS modules)", () => testTypes.add(TestType.cjs))
        .command("web", "run tests in web browser", () => testTypes.add(TestType.web))
        .command("manual", "start test server and print URL for manual testing", () => {
            testTypes.add(TestType.web);
            manual = true;
        })
        .strict().argv;

    const project = new Project(args.prefix);

    // If no test types are specified explicitly, run all enabled types
    if (!testTypes.size) {
        if (project.pkg.esm) {
            testTypes.add(TestType.esm);
        }
        if (project.pkg.cjs) {
            testTypes.add(TestType.cjs);
        }
        if (args.web) {
            testTypes.add(TestType.web);
        }
    }

    let esmBuilt = false;
    async function buildEsm() {
        if (esmBuilt) {
            return;
        }

        await project.buildSource("esm");
        await project.buildTests("esm");

        esmBuilt = true;
    }

    const progress = project.pkg.start("Testing");
    const runner = new TestRunner(project.pkg, progress, args);

    if (testTypes.has(TestType.esm)) {
        await buildEsm();
        await runner.runNode("esm");
    }

    if (testTypes.has(TestType.cjs)) {
        await project.buildSource("cjs");
        await project.buildTests("cjs");
        await runner.runNode("cjs");
    }

    if (testTypes.has(TestType.web)) {
        await buildEsm();
        await runner.runWeb(manual);
    }

    progress.shutdown();

    if (args.forceExit) {
        process.exit(0);
    }
}

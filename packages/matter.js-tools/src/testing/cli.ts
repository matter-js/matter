/**
 * @license
 * Copyright 2022-2024 Matter.js Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import "../util/node-shims.js";
import "./global-definitions.js";

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { Builder } from "../building/builder.js";
import { Graph } from "../building/graph.js";
import { Project } from "../building/project.js";
import { Package } from "../util/package.js";
import { TestRunner } from "./runner.js";

enum TestType {
    esm = "esm",
    cjs = "cjs",
    web = "web",
    chip = "chip",
}

Error.stackTraceLimit = 50;

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
            default: "./test/**/*Test.ts",
        })
        .option("all-logs", { type: "boolean", describe: "Emit log messages in real time" })
        .option("debug", { type: "boolean", describe: "Enable Mocha debugging" })
        .option("environment", { alias: "e", type: "string", describe: "Specify environment for CHIP tests" })
        .option("fgrep", { alias: "f", type: "string", describe: "Only run tests matching this string" })
        .option("force-exit", { type: "boolean", describe: "Force Node to exit after tests complete" })
        .option("grep", { alias: "g", type: "string", describe: "Only run tests matching this regexp" })
        .option("invert", { alias: "i", type: "boolean", describe: "Inverts --grep and --fgrep matches" })
        .option("profile", { type: "boolean", describe: "Write profiling data to build/profiles (node only)" })
        .option("wtf", { type: "boolean", describe: "Enlist wtfnode to detect test leaks" })
        .command("*", "run all supported test types")
        .command("esm", "run tests on node (ES6 modules)", () => testTypes.add(TestType.esm))
        .command("cjs", "run tests on node (CommonJS modules)", () => testTypes.add(TestType.cjs))
        .command("web", "run tests in web browser", () => testTypes.add(TestType.web))
        .command("chip", "run CHIP tests", () => testTypes.add(TestType.chip))
        .command("manual", "start test server and print URL for manual testing", () => {
            testTypes.add(TestType.web);
            manual = true;
        })
        .strict().argv;

    // If spec specified and prefix is default, use the spec file to locate the package
    let packageLocation = args.prefix;
    if (packageLocation === "." && args.spec) {
        const firstSpec = Array.isArray(args.spec) ? args.spec[0] : args.spec;
        packageLocation = firstSpec;
    }

    if (testTypes.has(TestType.chip)) {
        if (testTypes.size > 1) {
            throw new Error("CHIP tests must be run standalone");
        }

        packageLocation = Package.workspace.resolve("chip-testing");
    }

    const project = new Project(packageLocation);

    process.chdir(project.pkg.path);

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

    const builder = new Builder();
    const dependencies = await Graph.forProject(packageLocation);
    if (dependencies) {
        await dependencies.build(builder, false);
    } else {
        await builder.build(project);
    }

    const progress = project.pkg.start("Testing");
    const runner = new TestRunner(project.pkg, progress, args);

    if (testTypes.has(TestType.esm)) {
        await runner.runNode("esm");
    }

    if (testTypes.has(TestType.cjs)) {
        await runner.runNode("cjs");
    }

    if (testTypes.has(TestType.web)) {
        await runner.runWeb(manual);
    }

    if (testTypes.has(TestType.chip)) {
        let env;
        if (args.environment) {
            if (args.environment[0] === "{") {
                env = JSON.parse(args.environment);
            } else {
                env = args.environment;
            }
        } else {
            env = "default";
        }
        await runner.runChip(env);
    }

    progress.shutdown();

    if (args.forceExit) {
        process.exit(0);
    }
}

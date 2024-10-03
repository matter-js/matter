/**
 * @license
 * Copyright 2022-2024 Matter.js Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import colors from "ansi-colors";
import { createHash } from "crypto";
import { Progress } from "../util/progress.js";
import { BuildError } from "./error.js";
import { Graph } from "./graph.js";
import { BuildInformation, Project } from "./project.js";
import { createTypescriptContext } from "./typescript.js";
import { TypescriptContext } from "./typescript/context.js";

export enum Target {
    clean = "clean",
    types = "types",
    esm = "esm",
    cjs = "cjs",
}

export interface Options {
    targets?: Target[];
    clean?: boolean;
    graph?: Graph;
}

/**
 * High-level build coordination.
 *
 * Warning: This class is intended for command line use and will process.exit if things go wrong.
 */
export class Builder {
    unconditional: boolean;
    tsContext?: TypescriptContext;
    graph?: Graph;

    constructor(private options: Options = {}) {
        this.unconditional =
            options.clean || (options.targets !== undefined && options.targets?.indexOf(Target.clean) !== -1);
    }

    public async configure(project: Project) {
        if (!project.pkg.hasConfig) {
            return;
        }

        const progress = project.pkg.start("Configuring");

        try {
            await project.configure(progress);
        } catch (e: any) {
            progress.shutdown();
            process.stderr.write(`${e.stack ?? e.message}\n\n`);
            process.exit(1);
        }

        progress.shutdown();
    }

    public async build(project: Project) {
        const progress = project.pkg.start("Building");

        try {
            await this.#doBuild(project, progress);
        } catch (e: any) {
            progress.shutdown();
            process.stderr.write(`${e.stack ?? e.message}\n\n`);
            process.exit(1);
        }

        progress.shutdown();
    }

    async #doBuild(project: Project, progress: Progress) {
        const targets = this.#selectTargets(project);

        if (targets.has(Target.clean) || this.options.clean) {
            await progress.run("Clean", () => project.clean());
        }

        if (!targets.has(Target.types) && !targets.has(Target.esm) && !targets.has(Target.cjs)) {
            return;
        }

        const info: BuildInformation = {};

        const config = await project.configure(progress);

        await config?.before?.({ project, progress });

        // If available we use graph to access dependency API shas
        const graph = this.graph ?? (await Graph.forProject(project.pkg.path));
        let node: Graph.Node | undefined;
        if (graph) {
            node = graph.get(project.pkg.name);
            for (const dep of node.dependencies) {
                if (dep.info.apiSha !== undefined) {
                    if (info.dependencyApiShas === undefined) {
                        info.dependencyApiShas = {};
                    }
                    info.dependencyApiShas[dep.pkg.name] = dep.info.apiSha;
                }
            }
        }

        if (targets.has(Target.types)) {
            try {
                // Obtain or initialize typescript solution builder
                let context = this.tsContext;
                if (context === undefined) {
                    context = this.tsContext = await createTypescriptContext(
                        project.pkg.workspace,
                        graph,
                        progress.refresh.bind(progress),
                    );
                }

                if (project.pkg.isLibrary) {
                    const apiSha = createHash("sha1");

                    // Our API SHA changes if that of any dependency changes
                    if (node) {
                        for (const dep of node.dependencies) {
                            if (dep.info.apiSha !== undefined) {
                                apiSha.update(dep.info.apiSha);
                            }
                        }
                    }

                    await progress.run(`Generate ${progress.emphasize("type declarations")}`, () =>
                        context.build(project.pkg, "src"),
                    );
                    await progress.run(`Install ${progress.emphasize("type declarations")}`, () =>
                        project.installDeclarations(apiSha),
                    );

                    info.apiSha = apiSha.digest("hex");
                } else {
                    await progress.run(`Validate ${progress.emphasize("types")}`, () =>
                        context.build(project.pkg, "src", false),
                    );
                }
                if (project.pkg.hasTests) {
                    await progress.run(`Validate ${progress.emphasize("test types")}`, () =>
                        context.build(project.pkg, "test"),
                    );
                }
            } catch (e) {
                if (e instanceof BuildError) {
                    progress.failure("Terminating due to type errors");
                    process.stderr.write(e.diagnostics);
                    process.exit(1);
                }
                throw e;
            }
        }

        if (targets.has(Target.esm)) {
            await this.#transpile(project, progress, Target.esm);
        }

        if (targets.has(Target.cjs)) {
            await this.#transpile(project, progress, Target.cjs);
        }

        await config?.after?.({ project, progress });

        // Only update build information when there are no explicit targets so we know it's a full build
        if (!this.options.targets?.length) {
            await project.recordBuildInfo(info);
            if (node) {
                node.info = info;
            }
        }
    }

    async #transpile(project: Project, progress: Progress, format: "esm" | "cjs") {
        const fmt = format.toUpperCase();
        await progress.run(`Transpile ${progress.emphasize("library")} to ${colors.bold(fmt)}`, () =>
            project.buildSource(format),
        );
        if (project.pkg.hasTests) {
            await progress.run(`Transpile ${progress.emphasize("tests")} to ${colors.bold(fmt)}`, () =>
                project.buildTests(format),
            );
        }
    }

    #selectTargets(project: Project) {
        const targets = new Set<string>(this.options.targets);

        if (!targets.size) {
            targets.add(Target.types);

            if (project.pkg.supportsEsm) {
                targets.add(Target.esm);
            }

            if (project.pkg.supportsCjs) {
                targets.add(Target.cjs);
            }
        } else {
            if (!project.pkg.supportsEsm) {
                targets.delete(Target.esm);
            }

            if (!project.pkg.supportsCjs) {
                targets.delete(Target.cjs);
            }
        }

        return targets;
    }
}

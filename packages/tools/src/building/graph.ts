/**
 * @license
 * Copyright 2022-2024 Matter.js Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import mapWorkspaces from "@npmcli/map-workspaces";
import colors from "ansi-colors";
import { JsonNotFoundError, Package } from "../util/package.js";
import { Progress } from "../util/progress.js";
import { Builder } from "./builder.js";
import { InternalBuildError } from "./error.js";
import { BUILD_INFO_LOCATION, BuildInformation, Project } from "./project.js";

/**
 * Graph of dependencies for workspace packages.
 *
 * We use this information to determine which packages are "dirty" and need rebuild.  In the future we can also use for
 * parallel build, only tricky part there is showing status.
 */
export class Graph {
    protected constructor(readonly nodes: Graph.Node[]) {}

    get(name: string) {
        const node = this.nodes.find(node => node.pkg.name === name);
        if (node === undefined) {
            throw new Error(`Cannot locate package "${name}"`);
        }
        return node;
    }

    static async load(pkg = Package.workspace) {
        const nodeMap = await this.#loadNodes(pkg.workspace);
        return await this.#createGraph(Object.values(nodeMap));
    }

    static async forProject(path: string): Promise<Graph | undefined> {
        let workspace;
        try {
            workspace = Package.workspaceFor(path);
        } catch (e) {
            if (e instanceof JsonNotFoundError) {
                // Project is not in a workspace
                return;
            }
            throw e;
        }

        const nodeMap = await this.#loadNodes(workspace);

        const rootPkg = new Package({ path: path });
        const rootNode = nodeMap[rootPkg.json.name];
        if (!rootNode) {
            // Project resides under a workspace but is not part of the workspace
            return;
        }

        const nodes = new Set<Graph.Node>();
        function addNode(node: Graph.Node) {
            if (nodes.has(node)) {
                return;
            }
            nodes.add(node);
            for (const dependency of node.dependencies) {
                addNode(dependency);
            }
        }

        addNode(rootNode);

        return await this.#createGraph([...nodes]);
    }

    // TODO - parallelization will be trivial except need to update Progress
    // to support display of multiple simultaneous tasks
    async build(builder: Builder, showSkipped = true) {
        const toBuild = new Set(this.nodes);

        // We configure each build before building so that any generated files are in place before we initiate the build
        for (const node of this.nodes) {
            await builder.configure(node.project);
        }

        while (toBuild.size) {
            let node;

            nodes: for (node of toBuild) {
                for (const dep of node.dependencies) {
                    if (dep.isDirty) {
                        continue nodes;
                    }
                }
                break;
            }

            if (!node) {
                throw new Error("Internal logic error: No unbuilt project has fully built dependencies");
            }

            if (node.isDirty || builder.unconditional) {
                await builder.build(node.project);
                node.info.timestamp = new Date().toISOString();
            } else if (showSkipped) {
                new Progress().skip("Up to date", node.pkg);
            }

            toBuild.delete(node);
        }
    }

    display() {
        for (const node of this.nodes) {
            const progress = node.pkg.start("Node");
            progress.info("path", node.pkg.path);
            progress.info("modified", formatTime(node.modifyTime));
            progress.info("built", formatTime(node.info.timestamp ?? 0));
            progress.info("dirty", node.isDirty ? colors.dim.red("yes") : colors.dim.green("no"));
            progress.info("dependencies", node.dependencies.map(formatDep).join(", "));
            progress.shutdown();
        }
    }

    static async #createGraph(nodes: Graph.Node[]) {
        const graph = new Graph(nodes);

        await Promise.all(
            graph.nodes.map(async node => {
                if (node.pkg.hasFile(BUILD_INFO_LOCATION)) {
                    node.info = await node.pkg.readJson(BUILD_INFO_LOCATION);
                }

                node.modifyTime = await node.pkg.lastModified("package.json", "src", "test");

                return node;
            }),
        );

        const stack = Array<Graph.Node>();
        function findCircular(node: Graph.Node) {
            if (stack.indexOf(node) !== -1) {
                stack.push(node);
                throw new InternalBuildError(`Circular dependency: ${stack.map(formatDep).join(" ▸ ")}`);
            }
            stack.push(node);
            for (const dep of node.dependencies) {
                findCircular(dep);
            }
            stack.pop();
        }
        for (const node of graph.nodes) {
            findCircular(node);
        }

        return graph;
    }

    static async #loadNodes(workspace: Package) {
        const workspaces = await mapWorkspaces({ pkg: workspace.json, cwd: workspace.path });

        const nodeMap = {} as Record<string, Graph.Node>;
        const allDeps = {} as Record<string, string[]>;
        for (const path of workspaces.values()) {
            const pkg = new Package({ path: path });
            allDeps[pkg.json.name] = pkg.dependencies;
            nodeMap[pkg.json.name] = {
                pkg,
                project: new Project(pkg),
                dependencies: [],
                info: {},
                modifyTime: 0,

                get buildTime() {
                    return this.info.timestamp ? new Date(this.info.timestamp).getTime() : 0;
                },

                get isDirty() {
                    return (
                        this.modifyTime > this.buildTime ||
                        !!this.dependencies.find(
                            dep =>
                                dep.isDirty ||
                                (dep.buildTime > this.buildTime &&
                                    (dep.info.apiSha === undefined ||
                                        dep.info.apiSha !== this.info.dependencyApiShas?.[dep.pkg.name])),
                        )
                    );
                },

                // This version of dirty should only be used after building all dependencies.  If this project is
                // unmodified and the SHA of the type definitions of the target project is also unmodified then we do
                // not need to build
                get prebuildDirty() {
                    if (this.modifyTime > this.buildTime) {
                        return true;
                    }
                    const depShas = this.info.dependencyApiShas;
                    if (typeof depShas !== "object") {
                        return this.isDirty;
                    }
                    for (const dep of this.dependencies) {
                        const depSha = depShas[dep.pkg.name];
                        if (depSha === undefined || depSha !== dep.info.apiSha) {
                            return true;
                        }
                    }
                    return false;
                },
            };
        }

        for (const name in allDeps) {
            for (const dep of allDeps[name]) {
                const depNode = nodeMap[dep];

                // Note -- allow nodes to reference themselves, seems to be necessary on tools for use of tsc
                if (depNode && depNode !== nodeMap[name]) {
                    nodeMap[name].dependencies.push(depNode);
                }
            }
        }

        return nodeMap;
    }
}

export namespace Graph {
    export interface Node {
        pkg: Package;
        project: Project;
        dependencies: Node[];
        buildTime: number;
        info: BuildInformation;
        modifyTime: number;
        isDirty: boolean;
        prebuildDirty: boolean;
    }
}

function formatTime(time: number | string) {
    if (!time) {
        return colors.dim.red("never");
    }
    if (typeof time === "string") {
        time = new Date(time).getTime();
    }
    return new Date(time - new Date().getTimezoneOffset()).toISOString().split(".")[0].replace("T", " ");
}

function formatDep(node: Graph.Node) {
    return node.pkg.name.replace(/^@(?:project-chip|matter\.js)\//, "");
}

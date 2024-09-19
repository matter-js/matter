/**
 * @license
 * Copyright 2022-2024 Matter.js Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { resolve } from "path";
import { TsFile } from "./TsFile.js";

export function generateSubmoduleProxy(
    sourceModulePrefix: string,
    submodules: string[] | Record<string, string>,
    targetPath: string,
    generator?: (file: TsFile, submodule: string) => void | boolean,
) {
    const index = new TsFile(resolve(targetPath, "index"));

    if (Array.isArray(submodules)) {
        submodules = Object.fromEntries(submodules.map(n => [n, n]));
    }

    submodules = Object.fromEntries(
        Object.entries(submodules).map(([k, v]) => [k.replace(/\\/g, "/"), v.replace(/\\/g, "/")]),
    );

    for (let sourceFilename in submodules) {
        if (sourceFilename.match(/[\\/]index.ts$/)) {
            continue;
        }

        const destFilename = chooseName(submodules[sourceFilename]);
        sourceFilename = chooseName(sourceFilename);

        const file = new TsFile(resolve(targetPath, sourceFilename));

        if (generator?.(file, sourceFilename) !== false) {
            file.addReexport(`${sourceModulePrefix}/${destFilename}`);
        }

        file.save();
    }

    index.save();
}

function chooseName(filename: string) {
    return filename.replace(/\.ts$/, "").replace(/^.*[\\/]/, "");
}

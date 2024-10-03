/**
 * @license
 * Copyright 2022-2024 Matter.js Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { TypescriptContext } from "./typescript/context.js";
import { createSolutionBuilderContext } from "./typescript/solution-builder.js";

/**
 * Create a {@link TypescriptContext} for validating types and optionally emitting .d.ts file.
 *
 * We have multiple implementations as we've tried TS API variants.  We export the one we currently use here.
 */
export const createTypescriptContext = createSolutionBuilderContext;

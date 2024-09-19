/**
 * @license
 * Copyright 2022-2024 Matter.js Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AllClustersTestInstance } from "../src/AllClustersTestInstance.js";
import { App } from "./support.js";

describe("CGEN", () => {
    Chip.python(App(AllClustersTestInstance), "TC_CGEN_2_4");
});

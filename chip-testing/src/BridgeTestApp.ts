#!/usr/bin/env node
/**
 * @license
 * Copyright 2022-2024 Matter.js Authors
 * SPDX-License-Identifier: Apache-2.0
 */
import "@matter/nodejs";
import { BridgeTestInstance } from "./BridgeTestInstance.js";
import { startTestApp } from "./GenericTestApp.js";

console.log("Start BridgeApp");
console.log(process.pid);
console.log(process.argv);

startTestApp("BridgeApp", BridgeTestInstance).catch(console.error);

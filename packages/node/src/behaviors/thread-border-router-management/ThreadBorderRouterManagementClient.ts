/**
 * @license
 * Copyright 2022-2025 Matter.js Authors
 * SPDX-License-Identifier: Apache-2.0
 */

/*** THIS FILE IS GENERATED, DO NOT EDIT ***/

import { ThreadBorderRouterManagement } from "#clusters/thread-border-router-management";
import { ClusterBehavior } from "../../behavior/cluster/ClusterBehavior.js";
import { Identity } from "#general";

export const ThreadBorderRouterManagementClientConstructor = ClusterBehavior.for(ThreadBorderRouterManagement.Complete);
export interface ThreadBorderRouterManagementClient extends InstanceType<typeof ThreadBorderRouterManagementClientConstructor> {}
export interface ThreadBorderRouterManagementClientConstructor extends Identity<typeof ThreadBorderRouterManagementClientConstructor> {}
export const ThreadBorderRouterManagementClient: ThreadBorderRouterManagementClientConstructor = ThreadBorderRouterManagementClientConstructor;

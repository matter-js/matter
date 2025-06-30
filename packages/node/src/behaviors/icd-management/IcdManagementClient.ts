/**
 * @license
 * Copyright 2022-2025 Matter.js Authors
 * SPDX-License-Identifier: Apache-2.0
 */

/*** THIS FILE IS GENERATED, DO NOT EDIT ***/

import { IcdManagement } from "#clusters/icd-management";
import { ClusterBehavior } from "../../behavior/cluster/ClusterBehavior.js";
import { Identity } from "#general";

export const IcdManagementClientConstructor = ClusterBehavior.for(IcdManagement.Complete);
export interface IcdManagementClient extends InstanceType<typeof IcdManagementClientConstructor> {}
export interface IcdManagementClientConstructor extends Identity<typeof IcdManagementClientConstructor> {}
export const IcdManagementClient: IcdManagementClientConstructor = IcdManagementClientConstructor;

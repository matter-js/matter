/**
 * @license
 * Copyright 2022-2025 Matter.js Authors
 * SPDX-License-Identifier: Apache-2.0
 */

/*** THIS FILE IS GENERATED, DO NOT EDIT ***/

import { DishwasherAlarm } from "#clusters/dishwasher-alarm";
import { ClusterBehavior } from "../../behavior/cluster/ClusterBehavior.js";
import { Identity } from "#general";

export const DishwasherAlarmClientConstructor = ClusterBehavior.for(DishwasherAlarm.Complete);
export interface DishwasherAlarmClient extends InstanceType<typeof DishwasherAlarmClientConstructor> {}
export interface DishwasherAlarmClientConstructor extends Identity<typeof DishwasherAlarmClientConstructor> {}
export const DishwasherAlarmClient: DishwasherAlarmClientConstructor = DishwasherAlarmClientConstructor;

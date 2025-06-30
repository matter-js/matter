/**
 * @license
 * Copyright 2022-2025 Matter.js Authors
 * SPDX-License-Identifier: Apache-2.0
 */

/*** THIS FILE IS GENERATED, DO NOT EDIT ***/

import { BooleanStateConfiguration } from "#clusters/boolean-state-configuration";
import { ClusterBehavior } from "../../behavior/cluster/ClusterBehavior.js";
import { Identity } from "#general";

export const BooleanStateConfigurationClientConstructor = ClusterBehavior.for(BooleanStateConfiguration.Complete);
export interface BooleanStateConfigurationClient extends InstanceType<typeof BooleanStateConfigurationClientConstructor> {}
export interface BooleanStateConfigurationClientConstructor extends Identity<typeof BooleanStateConfigurationClientConstructor> {}
export const BooleanStateConfigurationClient: BooleanStateConfigurationClientConstructor = BooleanStateConfigurationClientConstructor;

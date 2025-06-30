/**
 * @license
 * Copyright 2022-2025 Matter.js Authors
 * SPDX-License-Identifier: Apache-2.0
 */

/*** THIS FILE IS GENERATED, DO NOT EDIT ***/

import { CarbonDioxideConcentrationMeasurement } from "#clusters/carbon-dioxide-concentration-measurement";
import { ClusterBehavior } from "../../behavior/cluster/ClusterBehavior.js";
import { Identity } from "#general";

export const CarbonDioxideConcentrationMeasurementClientConstructor = ClusterBehavior
    .for(CarbonDioxideConcentrationMeasurement.Complete);
export interface CarbonDioxideConcentrationMeasurementClient extends InstanceType<typeof CarbonDioxideConcentrationMeasurementClientConstructor> {}
export interface CarbonDioxideConcentrationMeasurementClientConstructor extends Identity<typeof CarbonDioxideConcentrationMeasurementClientConstructor> {}
export const CarbonDioxideConcentrationMeasurementClient: CarbonDioxideConcentrationMeasurementClientConstructor = CarbonDioxideConcentrationMeasurementClientConstructor;

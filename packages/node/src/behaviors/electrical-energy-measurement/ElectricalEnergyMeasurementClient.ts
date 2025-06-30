/**
 * @license
 * Copyright 2022-2025 Matter.js Authors
 * SPDX-License-Identifier: Apache-2.0
 */

/*** THIS FILE IS GENERATED, DO NOT EDIT ***/

import { ElectricalEnergyMeasurement } from "#clusters/electrical-energy-measurement";
import { ClusterBehavior } from "../../behavior/cluster/ClusterBehavior.js";
import { Identity } from "#general";

export const ElectricalEnergyMeasurementClientConstructor = ClusterBehavior.for(ElectricalEnergyMeasurement.Complete);
export interface ElectricalEnergyMeasurementClient extends InstanceType<typeof ElectricalEnergyMeasurementClientConstructor> {}
export interface ElectricalEnergyMeasurementClientConstructor extends Identity<typeof ElectricalEnergyMeasurementClientConstructor> {}
export const ElectricalEnergyMeasurementClient: ElectricalEnergyMeasurementClientConstructor = ElectricalEnergyMeasurementClientConstructor;

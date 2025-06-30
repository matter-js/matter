/**
 * @license
 * Copyright 2022-2025 Matter.js Authors
 * SPDX-License-Identifier: Apache-2.0
 */

/*** THIS FILE IS GENERATED, DO NOT EDIT ***/

import { EthernetNetworkDiagnostics } from "#clusters/ethernet-network-diagnostics";
import { ClusterBehavior } from "../../behavior/cluster/ClusterBehavior.js";
import { Identity } from "#general";

export const EthernetNetworkDiagnosticsClientConstructor = ClusterBehavior.for(EthernetNetworkDiagnostics.Complete);
export interface EthernetNetworkDiagnosticsClient extends InstanceType<typeof EthernetNetworkDiagnosticsClientConstructor> {}
export interface EthernetNetworkDiagnosticsClientConstructor extends Identity<typeof EthernetNetworkDiagnosticsClientConstructor> {}
export const EthernetNetworkDiagnosticsClient: EthernetNetworkDiagnosticsClientConstructor = EthernetNetworkDiagnosticsClientConstructor;

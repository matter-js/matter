/**
 * @license
 * Copyright 2022-2025 Matter.js Authors
 * SPDX-License-Identifier: Apache-2.0
 */

/*** THIS FILE IS GENERATED, DO NOT EDIT ***/

import { MatterDefinition } from "../MatterDefinition.js";
import { DeviceTypeElement as DeviceType, RequirementElement as Requirement } from "../../elements/index.js";

export const AirPurifierDt = DeviceType(
    { name: "AirPurifier", id: 0x2d },
    Requirement(
        { name: "Descriptor", id: 0x1d, element: "serverCluster" },
        Requirement({ name: "DeviceTypeList", default: [ { deviceType: 45, revision: 2 } ], element: "attribute" })
    ),
    Requirement({ name: "Identify", id: 0x3, conformance: "M", element: "serverCluster" }),
    Requirement({ name: "Groups", id: 0x4, conformance: "O", element: "serverCluster" }),
    Requirement({ name: "OnOff", id: 0x6, conformance: "O", element: "serverCluster" }),
    Requirement({ name: "FanControl", id: 0x202, conformance: "M", element: "serverCluster" }),
    Requirement({ name: "HepaFilterMonitoring", id: 0x71, conformance: "O", element: "serverCluster" }),
    Requirement({ name: "ActivatedCarbonFilterMonitoring", id: 0x72, conformance: "O", element: "serverCluster" })
);

MatterDefinition.children.push(AirPurifierDt);

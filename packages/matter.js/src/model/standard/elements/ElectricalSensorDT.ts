/**
 * @license
 * Copyright 2022-2024 Matter.js Authors
 * SPDX-License-Identifier: Apache-2.0
 */

/*** THIS FILE IS GENERATED, DO NOT EDIT ***/

import { Matter } from "../Matter.js";
import { DeviceTypeElement as DeviceType, RequirementElement as Requirement } from "../../elements/index.js";

export const ElectricalSensorDt = DeviceType({
    name: "ElectricalSensor", id: 0x510, classification: "utility",
    details: "An Electrical Sensor device measures the electrical power and/or energy being imported and/or " +
        "exported.",
    xref: { document: "device", section: "2.6" },

    children: [
        Requirement({
            name: "Descriptor", id: 0x1d, element: "serverCluster",
            children: [Requirement({ name: "DeviceTypeList", default: [ { deviceType: 1296, revision: 1 } ], element: "attribute" })]
        }),
        Requirement({
            name: "PowerTopology", id: 0x9c, conformance: "M", element: "serverCluster",
            xref: { document: "device", section: "2.6.4" }
        }),
        Requirement({
            name: "ElectricalPowerMeasurement", id: 0x90, conformance: "O.a+", element: "serverCluster",
            xref: { document: "device", section: "2.6.4" }
        }),
        Requirement({
            name: "ElectricalEnergyMeasurement", id: 0x91, conformance: "O.a+", element: "serverCluster",
            xref: { document: "device", section: "2.6.4" }
        })
    ]
});

Matter.children.push(ElectricalSensorDt);

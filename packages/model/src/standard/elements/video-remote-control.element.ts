/**
 * @license
 * Copyright 2022-2025 Matter.js Authors
 * SPDX-License-Identifier: Apache-2.0
 */

/*** THIS FILE IS GENERATED, DO NOT EDIT ***/

import { MatterDefinition } from "../MatterDefinition.js";
import { DeviceTypeElement as DeviceType, RequirementElement as Requirement } from "../../elements/index.js";

export const VideoRemoteControlDt = DeviceType(
    { name: "VideoRemoteControl", id: 0x2a },
    Requirement(
        { name: "Descriptor", id: 0x1d, element: "serverCluster" },
        Requirement({ name: "DeviceTypeList", default: [ { deviceType: 42, revision: 2 } ], element: "attribute" })
    ),
    Requirement({ name: "OnOff", id: 0x6, conformance: "M", element: "clientCluster" }),
    Requirement({ name: "LevelControl", id: 0x8, conformance: "O", element: "clientCluster" }),
    Requirement({ name: "WakeOnLan", id: 0x503, conformance: "O", element: "clientCluster" }),
    Requirement({ name: "Channel", id: 0x504, conformance: "O", element: "clientCluster" }),
    Requirement({ name: "TargetNavigator", id: 0x505, conformance: "O", element: "clientCluster" }),
    Requirement({ name: "MediaPlayback", id: 0x506, conformance: "M", element: "clientCluster" }),
    Requirement({ name: "MediaInput", id: 0x507, conformance: "O", element: "clientCluster" }),
    Requirement({ name: "LowPower", id: 0x508, conformance: "O", element: "clientCluster" }),
    Requirement({ name: "KeypadInput", id: 0x509, conformance: "M", element: "clientCluster" }),
    Requirement({ name: "ContentLauncher", id: 0x50a, conformance: "O", element: "clientCluster" }),
    Requirement({ name: "AudioOutput", id: 0x50b, conformance: "O", element: "clientCluster" }),
    Requirement({ name: "ApplicationLauncher", id: 0x50c, conformance: "O", element: "clientCluster" }),
    Requirement({ name: "AccountLogin", id: 0x50e, conformance: "O", element: "clientCluster" }),
    Requirement({ name: "ContentControl", id: 0x50f, conformance: "P, O", element: "clientCluster" })
);

MatterDefinition.children.push(VideoRemoteControlDt);

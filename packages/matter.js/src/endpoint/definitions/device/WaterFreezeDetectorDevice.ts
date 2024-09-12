/**
 * @license
 * Copyright 2022-2024 Matter.js Authors
 * SPDX-License-Identifier: Apache-2.0
 */

/*** THIS FILE IS GENERATED, DO NOT EDIT ***/

import { IdentifyServer as BaseIdentifyServer } from "../../../behavior/definitions/identify/IdentifyServer.js";
import {
    BooleanStateServer as BaseBooleanStateServer
} from "../../../behavior/definitions/boolean-state/BooleanStateServer.js";
import {
    BooleanStateConfigurationServer as BaseBooleanStateConfigurationServer
} from "../../../behavior/definitions/boolean-state-configuration/BooleanStateConfigurationServer.js";
import { MutableEndpoint } from "../../type/MutableEndpoint.js";
import { SupportedBehaviors } from "../../properties/SupportedBehaviors.js";
import { Identity } from "@project-chip/matter.js-general";

/**
 * This defines conformance to the Water Freeze Detector device type.
 *
 * @see {@link MatterSpecification.v13.Device} § 7.11
 */
export interface WaterFreezeDetectorDevice extends Identity<typeof WaterFreezeDetectorDeviceDefinition> {}

export namespace WaterFreezeDetectorRequirements {
    /**
     * The Identify cluster is required by the Matter specification.
     *
     * We provide this alias to the default implementation {@link IdentifyServer} for convenience.
     */
    export const IdentifyServer = BaseIdentifyServer;

    /**
     * The BooleanState cluster is required by the Matter specification.
     *
     * This version of {@link BooleanStateServer} is specialized per the specification.
     */
    export const BooleanStateServer = BaseBooleanStateServer.alter({ events: { stateChange: { optional: false } } });

    /**
     * The BooleanStateConfiguration cluster is optional per the Matter specification.
     *
     * We provide this alias to the default implementation {@link BooleanStateConfigurationServer} for convenience.
     */
    export const BooleanStateConfigurationServer = BaseBooleanStateConfigurationServer;

    /**
     * An implementation for each server cluster supported by the endpoint per the Matter specification.
     */
    export const server = {
        mandatory: { Identify: IdentifyServer, BooleanState: BooleanStateServer },
        optional: { BooleanStateConfiguration: BooleanStateConfigurationServer }
    };
}

export const WaterFreezeDetectorDeviceDefinition = MutableEndpoint({
    name: "WaterFreezeDetector",
    deviceType: 0x41,
    deviceRevision: 1,
    requirements: WaterFreezeDetectorRequirements,
    behaviors: SupportedBehaviors(
        WaterFreezeDetectorRequirements.server.mandatory.Identify,
        WaterFreezeDetectorRequirements.server.mandatory.BooleanState
    )
});

export const WaterFreezeDetectorDevice: WaterFreezeDetectorDevice = WaterFreezeDetectorDeviceDefinition;

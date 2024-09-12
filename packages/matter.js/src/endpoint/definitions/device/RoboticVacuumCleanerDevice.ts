/**
 * @license
 * Copyright 2022-2024 Matter.js Authors
 * SPDX-License-Identifier: Apache-2.0
 */

/*** THIS FILE IS GENERATED, DO NOT EDIT ***/

import { IdentifyServer as BaseIdentifyServer } from "../../../behavior/definitions/identify/IdentifyServer.js";
import { RvcRunModeServer as BaseRvcRunModeServer } from "../../../behavior/definitions/rvc-run-mode/RvcRunModeServer.js";
import {
    RvcOperationalStateServer as BaseRvcOperationalStateServer
} from "../../../behavior/definitions/rvc-operational-state/RvcOperationalStateServer.js";
import {
    RvcCleanModeServer as BaseRvcCleanModeServer
} from "../../../behavior/definitions/rvc-clean-mode/RvcCleanModeServer.js";
import { MutableEndpoint } from "../../type/MutableEndpoint.js";
import { SupportedBehaviors } from "../../properties/SupportedBehaviors.js";
import { Identity } from "@project-chip/matter.js-general";

/**
 * This defines conformance for the Robotic Vacuum Cleaner device type.
 *
 * @see {@link MatterSpecification.v13.Device} § 12.1
 */
export interface RoboticVacuumCleanerDevice extends Identity<typeof RoboticVacuumCleanerDeviceDefinition> {}

export namespace RoboticVacuumCleanerRequirements {
    /**
     * The Identify cluster is required by the Matter specification.
     *
     * We provide this alias to the default implementation {@link IdentifyServer} for convenience.
     */
    export const IdentifyServer = BaseIdentifyServer;

    /**
     * The RvcRunMode cluster is required by the Matter specification.
     *
     * We provide this alias to the default implementation {@link RvcRunModeServer} for convenience.
     */
    export const RvcRunModeServer = BaseRvcRunModeServer;

    /**
     * The RvcOperationalState cluster is required by the Matter specification.
     *
     * We provide this alias to the default implementation {@link RvcOperationalStateServer} for convenience.
     */
    export const RvcOperationalStateServer = BaseRvcOperationalStateServer;

    /**
     * The RvcCleanMode cluster is optional per the Matter specification.
     *
     * We provide this alias to the default implementation {@link RvcCleanModeServer} for convenience.
     */
    export const RvcCleanModeServer = BaseRvcCleanModeServer;

    /**
     * An implementation for each server cluster supported by the endpoint per the Matter specification.
     */
    export const server = {
        mandatory: {
            Identify: IdentifyServer,
            RvcRunMode: RvcRunModeServer,
            RvcOperationalState: RvcOperationalStateServer
        },
        optional: { RvcCleanMode: RvcCleanModeServer }
    };
}

export const RoboticVacuumCleanerDeviceDefinition = MutableEndpoint({
    name: "RoboticVacuumCleaner",
    deviceType: 0x74,
    deviceRevision: 2,
    requirements: RoboticVacuumCleanerRequirements,
    behaviors: SupportedBehaviors(
        RoboticVacuumCleanerRequirements.server.mandatory.Identify,
        RoboticVacuumCleanerRequirements.server.mandatory.RvcRunMode,
        RoboticVacuumCleanerRequirements.server.mandatory.RvcOperationalState
    )
});

export const RoboticVacuumCleanerDevice: RoboticVacuumCleanerDevice = RoboticVacuumCleanerDeviceDefinition;

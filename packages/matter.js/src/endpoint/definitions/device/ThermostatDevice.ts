/**
 * @license
 * Copyright 2022-2024 Matter.js Authors
 * SPDX-License-Identifier: Apache-2.0
 */

/*** THIS FILE IS GENERATED, DO NOT EDIT ***/

import { IdentifyServer as BaseIdentifyServer } from "../../../behavior/definitions/identify/IdentifyServer.js";
import { ThermostatServer as BaseThermostatServer } from "../../../behavior/definitions/thermostat/ThermostatServer.js";
import { GroupsServer as BaseGroupsServer } from "../../../behavior/definitions/groups/GroupsServer.js";
import {
    ScenesManagementServer as BaseScenesManagementServer
} from "../../../behavior/definitions/scenes-management/ScenesManagementServer.js";
import {
    ThermostatUserInterfaceConfigurationServer as BaseThermostatUserInterfaceConfigurationServer
} from "../../../behavior/definitions/thermostat-user-interface-configuration/ThermostatUserInterfaceConfigurationServer.js";
import {
    EnergyPreferenceServer as BaseEnergyPreferenceServer
} from "../../../behavior/definitions/energy-preference/EnergyPreferenceServer.js";
import {
    TimeSynchronizationServer as BaseTimeSynchronizationServer
} from "../../../behavior/definitions/time-synchronization/TimeSynchronizationServer.js";
import {
    RelativeHumidityMeasurementBehavior as BaseRelativeHumidityMeasurementBehavior
} from "../../../behavior/definitions/relative-humidity-measurement/RelativeHumidityMeasurementBehavior.js";
import {
    TimeSynchronizationBehavior as BaseTimeSynchronizationBehavior
} from "../../../behavior/definitions/time-synchronization/TimeSynchronizationBehavior.js";
import {
    FanControlBehavior as BaseFanControlBehavior
} from "../../../behavior/definitions/fan-control/FanControlBehavior.js";
import {
    TemperatureMeasurementBehavior as BaseTemperatureMeasurementBehavior
} from "../../../behavior/definitions/temperature-measurement/TemperatureMeasurementBehavior.js";
import {
    OccupancySensingBehavior as BaseOccupancySensingBehavior
} from "../../../behavior/definitions/occupancy-sensing/OccupancySensingBehavior.js";
import { MutableEndpoint } from "../../type/MutableEndpoint.js";
import { SupportedBehaviors } from "../../properties/SupportedBehaviors.js";
import { Identity } from "@project-chip/matter.js-general";

/**
 * A Thermostat device is capable of having either built-in or separate sensors for temperature, humidity or occupancy.
 * It allows the desired temperature to be set either remotely or locally. The thermostat is capable of sending heating
 * and/or cooling requirement notifications to a heating/cooling unit (for example, an indoor air handler) or is
 * capable of including a mechanism to control a heating or cooling unit directly.
 *
 * ThermostatDevice requires Thermostat cluster but Thermostat is not added by default because you must select the
 * features your device supports. You can add manually using ThermostatDevice.with().
 *
 * @see {@link MatterSpecification.v13.Device} § 9.1
 */
export interface ThermostatDevice extends Identity<typeof ThermostatDeviceDefinition> {}

export namespace ThermostatRequirements {
    /**
     * The Identify cluster is required by the Matter specification.
     *
     * We provide this alias to the default implementation {@link IdentifyServer} for convenience.
     */
    export const IdentifyServer = BaseIdentifyServer;

    /**
     * The Thermostat cluster is required by the Matter specification.
     *
     * We provide this alias to the default implementation {@link ThermostatServer} for convenience.
     */
    export const ThermostatServer = BaseThermostatServer;

    /**
     * The Groups cluster is optional per the Matter specification.
     *
     * We provide this alias to the default implementation {@link GroupsServer} for convenience.
     */
    export const GroupsServer = BaseGroupsServer;

    /**
     * The ScenesManagement cluster is optional per the Matter specification.
     *
     * We provide this alias to the default implementation {@link ScenesManagementServer} for convenience.
     */
    export const ScenesManagementServer = BaseScenesManagementServer;

    /**
     * The ThermostatUserInterfaceConfiguration cluster is optional per the Matter specification.
     *
     * We provide this alias to the default implementation {@link ThermostatUserInterfaceConfigurationServer} for
     * convenience.
     */
    export const ThermostatUserInterfaceConfigurationServer = BaseThermostatUserInterfaceConfigurationServer;

    /**
     * The EnergyPreference cluster is optional per the Matter specification.
     *
     * We provide this alias to the default implementation {@link EnergyPreferenceServer} for convenience.
     */
    export const EnergyPreferenceServer = BaseEnergyPreferenceServer;

    /**
     * The TimeSynchronization cluster is optional per the Matter specification.
     *
     * We provide this alias to the default implementation {@link TimeSynchronizationServer} for convenience.
     */
    export const TimeSynchronizationServer = BaseTimeSynchronizationServer;

    /**
     * The RelativeHumidityMeasurement cluster is optional per the Matter specification.
     *
     * We provide this alias to the default implementation {@link RelativeHumidityMeasurementBehavior} for convenience.
     */
    export const RelativeHumidityMeasurementBehavior = BaseRelativeHumidityMeasurementBehavior;

    /**
     * The TimeSynchronization cluster is optional per the Matter specification.
     *
     * We provide this alias to the default implementation {@link TimeSynchronizationBehavior} for convenience.
     */
    export const TimeSynchronizationBehavior = BaseTimeSynchronizationBehavior;

    /**
     * The FanControl cluster is optional per the Matter specification.
     *
     * We provide this alias to the default implementation {@link FanControlBehavior} for convenience.
     */
    export const FanControlBehavior = BaseFanControlBehavior;

    /**
     * The TemperatureMeasurement cluster is optional per the Matter specification.
     *
     * We provide this alias to the default implementation {@link TemperatureMeasurementBehavior} for convenience.
     */
    export const TemperatureMeasurementBehavior = BaseTemperatureMeasurementBehavior;

    /**
     * The OccupancySensing cluster is optional per the Matter specification.
     *
     * We provide this alias to the default implementation {@link OccupancySensingBehavior} for convenience.
     */
    export const OccupancySensingBehavior = BaseOccupancySensingBehavior;

    /**
     * An implementation for each server cluster supported by the endpoint per the Matter specification.
     */
    export const server = {
        mandatory: { Identify: IdentifyServer, Thermostat: ThermostatServer },

        optional: {
            Groups: GroupsServer,
            ScenesManagement: ScenesManagementServer,
            ThermostatUserInterfaceConfiguration: ThermostatUserInterfaceConfigurationServer,
            EnergyPreference: EnergyPreferenceServer,
            TimeSynchronization: TimeSynchronizationServer
        }
    };

    /**
     * A definition for each client cluster supported by the endpoint per the Matter specification.
     */
    export const client = {
        optional: {
            RelativeHumidityMeasurement: RelativeHumidityMeasurementBehavior,
            TimeSynchronization: TimeSynchronizationBehavior,
            FanControl: FanControlBehavior,
            TemperatureMeasurement: TemperatureMeasurementBehavior,
            OccupancySensing: OccupancySensingBehavior
        },

        mandatory: {}
    };
}

export const ThermostatDeviceDefinition = MutableEndpoint({
    name: "Thermostat",
    deviceType: 0x301,
    deviceRevision: 3,
    requirements: ThermostatRequirements,
    behaviors: SupportedBehaviors(ThermostatRequirements.server.mandatory.Identify)
});

export const ThermostatDevice: ThermostatDevice = ThermostatDeviceDefinition;

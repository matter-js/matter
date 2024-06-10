/**
 * @license
 * Copyright 2022-2024 Matter.js Authors
 * SPDX-License-Identifier: Apache-2.0
 */

/*** THIS FILE IS GENERATED, DO NOT EDIT ***/

import { MaybePromise } from "../../../util/Promises.js";
import { TemperatureControl } from "../../../cluster/definitions/TemperatureControlCluster.js";

export namespace TemperatureControlInterface {
    export interface Base {
        /**
         * @see {@link MatterSpecification.v13.Cluster} § 8.2.6.1
         */
        setTemperature(request: TemperatureControl.SetTemperatureRequest): MaybePromise;
    }
}

export type TemperatureControlInterface = { components: [{ flags: {}, methods: TemperatureControlInterface.Base }] };

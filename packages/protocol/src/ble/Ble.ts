/**
 * @license
 * Copyright 2022-2025 Matter.js Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Bytes, Channel, ChannelType, MatterError, NetInterface, NoProviderError, TransportInterface } from "#general";
import { Scanner } from "../common/Scanner.js";
import { BLE_MAX_MATTER_PAYLOAD_SIZE } from "./BleConsts.js";

export class BleError extends MatterError {}

function BleDisabled(): Ble {
    throw new NoProviderError("No provider configured");
}

// TODO - need to factor out the general platform BLE from Matter/BTP so this can move into matter.js-general
export abstract class Ble {
    static get = BleDisabled;

    static get enabled() {
        return this.get !== BleDisabled;
    }

    abstract get peripheralInterface(): BlePeripheralInterface;
    abstract get centralInterface(): NetInterface;
    abstract get scanner(): Scanner;
}

export interface BlePeripheralInterface extends TransportInterface {
    advertise(advertiseData: Bytes, additionalAdvertisementData?: Bytes, intervalMs?: number): Promise<void>;
    stopAdvertising(): Promise<void>;
}

export abstract class BleChannel<T> implements Channel<T> {
    readonly maxPayloadSize = BLE_MAX_MATTER_PAYLOAD_SIZE;
    readonly isReliable = true; // BLE uses BTP which is reliable
    readonly type = ChannelType.BLE;

    abstract name: string;
    abstract send(data: T): Promise<void>;
    abstract close(): Promise<void>;
}

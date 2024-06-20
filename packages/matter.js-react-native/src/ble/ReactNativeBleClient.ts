/**
 * @license
 * Copyright 2022-2024 Matter.js Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BLE_MATTER_SERVICE_UUID } from "@project-chip/matter.js/ble";
import { MatterError } from "@project-chip/matter.js/common";
import { Logger } from "@project-chip/matter.js/log";
import { ByteArray } from "@project-chip/matter.js/util";
import { BleError, BleErrorCode, BleManager, State as BluetoothState, Device } from "react-native-ble-plx";

const logger = Logger.get("ReactNativeBleClient");

export class BluetoothUnauthorizedError extends MatterError {}
export class BluetoothUnsupportedError extends MatterError {}

export class ReactNativeBleClient {
    private readonly bleManager = new BleManager();
    private readonly discoveredPeripherals = new Map<string, { peripheral: Device; matterServiceData: ByteArray }>();
    private shouldScan = false;
    private isScanning = false;
    private bleState = BluetoothState.Unknown;
    private deviceDiscoveredCallback: ((peripheral: Device, manufacturerData: ByteArray) => void) | undefined;

    constructor() {
        // this.bleMnager.setLogLevel(LogLevel.Verbose)
        const subscription = this.bleManager.onStateChange(state => {
            this.bleState = state;
            logger.debug(`BLE state changed to ${state}`);
            switch (state) {
                case BluetoothState.PoweredOff:
                    this.bleManager.enable().catch(error => {
                        subscription.remove();
                        if (error instanceof BleError && error.errorCode === BleErrorCode.BluetoothUnauthorized) {
                            throw new BluetoothUnauthorizedError("Bluetooth is unauthorized");
                        }
                        throw error;
                    });
                    break;
                case BluetoothState.PoweredOn:
                    subscription.remove();
                    if (this.shouldScan) {
                        void this.startScanning();
                    }
                    break;
                case BluetoothState.Unauthorized:
                    subscription.remove();
                    throw new BluetoothUnauthorizedError("Bluetooth is unauthorized");
                case BluetoothState.Unsupported:
                    subscription.remove();
                    throw new BluetoothUnsupportedError("Bluetooth is unsupported");
                default:
                    logger.error("Unexpected BLE state", state);
                    subscription.remove();
                    void this.stopScanning();
            }
        });
    }

    public setDiscoveryCallback(callback: (peripheral: Device, manufacturerData: ByteArray) => void) {
        this.deviceDiscoveredCallback = callback;
        for (const { peripheral, matterServiceData } of this.discoveredPeripherals.values()) {
            this.deviceDiscoveredCallback(peripheral, matterServiceData);
        }
    }

    public async startScanning() {
        if (this.isScanning) return;

        this.shouldScan = true;
        if (this.bleState === BluetoothState.PoweredOn) {
            logger.debug("Start BLE scanning for Matter Services ...");
            this.isScanning = true;
            await this.bleManager.startDeviceScan([BLE_MATTER_SERVICE_UUID], {}, (error, peripheral) => {
                if (error !== null || peripheral === null) {
                    this.isScanning = false;
                    logger.error("Error while scanning for BLE devices", error);
                    if (this.shouldScan) {
                        this.startScanning().catch(error =>
                            logger.error("Error while restarting scanning after error", error),
                        );
                    } else {
                        this.stopScanning().catch(error =>
                            logger.error("Error while stopping scanning after error", error),
                        );
                    }
                    return;
                }
                this.handleDiscoveredDevice(peripheral);
            });
        } else {
            logger.debug("ble state is not poweredOn ... delay scanning till poweredOn");
        }
    }

    public async stopScanning() {
        this.shouldScan = false;
        logger.debug("Stop BLE scanning for Matter Services ...");
        await this.bleManager.stopDeviceScan();
        this.isScanning = false;
    }

    private handleDiscoveredDevice(peripheral: Device) {
        // The advertisement data contains a name, power level (if available), certain advertised service uuids,
        // as well as manufacturer data.
        // {"localName":"MATTER-3840","serviceData":[{"uuid":"fff6","data":{"type":"Buffer","data":[0,0,15,241,255,1,128,0]}}],"serviceUuids":["fff6"],"solicitationServiceUuids":[],"serviceSolicitationUuids":[]}
        logger.debug(
            `Found peripheral ${peripheral.id} (${peripheral.localName}) with serviceData ${Logger.toJSON(peripheral.serviceData)}`,
        );

        if (!peripheral.isConnectable) {
            logger.info(`Peripheral ${peripheral.id} is not connectable ... ignoring`);
            return;
        }
        const matterServiceDataBase64 = peripheral.serviceData?.[BLE_MATTER_SERVICE_UUID];
        if (matterServiceDataBase64 === undefined) {
            logger.info(`Peripheral ${peripheral.id} does not advertise Matter Service ... ignoring`);
            return;
        }
        const matterServiceData = ByteArray.fromBase64(matterServiceDataBase64);
        if (matterServiceData.length !== 8) {
            logger.info(`Peripheral ${peripheral.id} does not advertise Matter Service ... ignoring`);
            return;
        }

        this.discoveredPeripherals.set(peripheral.id, {
            peripheral,
            matterServiceData: matterServiceData,
        });

        this.deviceDiscoveredCallback?.(peripheral, matterServiceData);
    }
}

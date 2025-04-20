/**
 * @license
 * Copyright 2022-2025 Matter.js Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Diagnostic, Logger } from "@matter/general";
import { require } from "@matter/nodejs-ble/require";
import { BLE_MATTER_SERVICE_UUID } from "@matter/protocol";
import type { Noble, Peripheral } from "@stoprocent/noble";
import { BleOptions } from "./NodeJsBle.js";

const logger = Logger.get("NobleBleClient");
let noble: Noble;

function loadNoble(hciId?: number) {
    // load noble driver with the correct device selected
    if (hciId !== undefined) {
        process.env.NOBLE_HCI_DEVICE_ID = hciId.toString();
    }
    noble = require("@stoprocent/noble");
    if (typeof noble.on !== "function") {
        // The following commit broke the default exported instance of noble:
        // https://github.com/abandonware/noble/commit/b67eea246f719947fc45b1b52b856e61637a8a8e
        noble = (noble as any)({ extended: false });
    }
}

export class NobleBleClient {
    private readonly discoveredPeripherals = new Map<
        string,
        { peripheral: Peripheral; matterServiceData: Uint8Array }
    >();
    private shouldScan = false;
    private isScanning = false;
    private nobleState = "unknown";
    private deviceDiscoveredCallback: ((peripheral: Peripheral, manufacturerData: Uint8Array) => void) | undefined;

    constructor(options?: BleOptions) {
        const { environment } = options ?? {};
        environment?.runtime.add(this);

        loadNoble(options?.hciId);
        /*try {
            noble.reset();
        } catch (error: any) {
            logger.debug(
                `Error resetting BLE device via noble (can be ignored, we just tried): ${
                    (error as unknown as Error).message
                }`,
            );
        }*/
        noble.on("stateChange", state => {
            this.nobleState = state;
            logger.debug(`Noble state changed to ${state}`);
            if (state === "poweredOn") {
                if (this.shouldScan) {
                    void this.startScanning();
                }
            } else {
                void this.stopScanning();
            }
        });
        noble.on("discover", peripheral => this.handleDiscoveredDevice(peripheral));
        noble.on("scanStart", () => {
            if (!this.shouldScan) {
                // Noble sometimes emits scanStart when we did not asked for and misses the scanStop event
                // TODO: Remove as soon as Noble fixed this behavior
                return;
            }
            this.isScanning = true;
        });
        noble.on("scanStop", () => (this.isScanning = false));
    }

    [Symbol.asyncDispose]() {
        return this.stopScanning();
    }

    public setDiscoveryCallback(callback: (peripheral: Peripheral, manufacturerData: Uint8Array) => void) {
        this.deviceDiscoveredCallback = callback;
        for (const { peripheral, matterServiceData } of this.discoveredPeripherals.values()) {
            this.deviceDiscoveredCallback(peripheral, matterServiceData);
        }
    }

    public async startScanning() {
        if (this.isScanning) {
            return;
        }

        this.shouldScan = true;
        if (this.nobleState === "poweredOn") {
            logger.debug("Start BLE scanning for Matter Services ...");
            // TODO Remove this Windows hack once Noble Windows issue is fixed
            //  see https://github.com/stoprocent/noble/issues/20
            await noble.startScanningAsync(process.platform !== "win32" ? [BLE_MATTER_SERVICE_UUID] : undefined, true);
        } else {
            logger.debug("noble state is not poweredOn ... delay scanning till poweredOn");
        }
    }

    public async stopScanning() {
        this.shouldScan = false;
        if (this.isScanning) {
            logger.debug("Stop BLE scanning for Matter Services ...");
            await noble.stopScanningAsync();
        }
    }

    private handleDiscoveredDevice(peripheral: Peripheral) {
        // The advertisement data contains a name, power level (if available), certain advertised service uuids,
        // as well as manufacturer data.
        // {"localName":"MATTER-3840","serviceData":[{"uuid":"fff6","data":{"type":"Buffer","data":[0,0,15,241,255,1,128,0]}}],"serviceUuids":["fff6"],"solicitationServiceUuids":[],"serviceSolicitationUuids":[]}

        // TODO Remove this Windows hack once Noble Windows issue is fixed
        //  see https://github.com/stoprocent/noble/issues/20
        if (
            process.platform === "win32" &&
            !peripheral.advertisement.serviceData.some(({ uuid }) => uuid === BLE_MATTER_SERVICE_UUID)
        ) {
            return;
        }

        const address = peripheral.address;
        logger.debug(
            `Found peripheral ${address} (${peripheral.advertisement.localName}): ${Diagnostic.json(
                peripheral.advertisement,
            )}`,
        );

        if (!peripheral.connectable) {
            logger.info(`Peripheral ${address} is not connectable ... ignoring`);
            return;
        }
        const matterServiceData = peripheral.advertisement.serviceData.find(
            ({ uuid }) => uuid === BLE_MATTER_SERVICE_UUID,
        );
        if (matterServiceData === undefined || matterServiceData.data.length !== 8) {
            logger.info(`Peripheral ${address} does not advertise Matter Service ... ignoring`);
            return;
        }

        this.discoveredPeripherals.set(address, { peripheral, matterServiceData: matterServiceData.data });

        this.deviceDiscoveredCallback?.(peripheral, matterServiceData.data);
    }
}

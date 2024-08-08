/**
 * @license
 * Copyright 2022-2024 Matter.js Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
    BLE_MATTER_C1_CHARACTERISTIC_UUID,
    BLE_MATTER_C2_CHARACTERISTIC_UUID,
    BLE_MATTER_C3_CHARACTERISTIC_UUID,
    BLE_MATTER_SERVICE_UUID,
    BLE_MAXIMUM_BTP_MTU,
    BLE_MAX_MATTER_PAYLOAD_SIZE,
    BTP_CONN_RSP_TIMEOUT_MS,
    BTP_MAXIMUM_WINDOW_SIZE,
    BTP_SUPPORTED_VERSIONS,
    Ble,
    BleError,
    BtpFlowError,
    BtpSessionHandler,
} from "@project-chip/matter.js/ble";
import { BtpCodec } from "@project-chip/matter.js/codec";
import { Channel, InternalError, Listener, ServerAddress } from "@project-chip/matter.js/common";
import { Logger } from "@project-chip/matter.js/log";
import { NetInterface } from "@project-chip/matter.js/net";
import { Time } from "@project-chip/matter.js/time";
import { ByteArray, createPromise } from "@project-chip/matter.js/util";
import {
    BleErrorCode,
    Characteristic,
    Device,
    BleError as ReactNativeBleError,
    Subscription,
} from "react-native-ble-plx";
import { BleScanner } from "./BleScanner.js";

const logger = Logger.get("BleChannel");

export class ReactNativeBleCentralInterface implements NetInterface {
    private openChannels: Map<ServerAddress, Device> = new Map();
    private onMatterMessageListener: ((socket: Channel<ByteArray>, data: ByteArray) => void) | undefined;

    async openChannel(address: ServerAddress): Promise<Channel<ByteArray>> {
        if (address.type !== "ble") {
            throw new InternalError(`Unsupported address type ${address.type}.`);
        }
        if (this.onMatterMessageListener === undefined) {
            throw new InternalError(`Network Interface was not added to the system yet.`);
        }

        // Get the peripheral by address and connect to it.
        const { peripheral, hasAdditionalAdvertisementData } = (
            Ble.get().getBleScanner() as BleScanner
        ).getDiscoveredDevice(address.peripheralAddress);
        if (this.openChannels.has(address)) {
            throw new BleError(
                `Peripheral ${address.peripheralAddress} is already connected. Only one connection supported right now.`,
            );
        }
        logger.debug(`Connect to Peripheral now`);
        let device: Device;
        try {
            device = await peripheral.connect();
        } catch (error) {
            if (error instanceof ReactNativeBleError && error.errorCode === BleErrorCode.DeviceAlreadyConnected) {
                device = peripheral;
            } else {
                throw new BleError(`Error connecting to peripheral: ${(error as any).message}`);
            }
        }
        logger.debug(`Peripheral connected successfully, MTU = ${device.mtu}`);

        // Once the peripheral has been connected, then discover the services and characteristics of interest.
        device = await device.discoverAllServicesAndCharacteristics();

        const services = await device.services();

        for (const service of services) {
            logger.debug(`found service: ${service.uuid}`);
            if (service.uuid !== BLE_MATTER_SERVICE_UUID) continue;

            // So, discover its characteristics.
            const characteristics = await device.characteristicsForService(service.uuid);

            let characteristicC1ForWrite: Characteristic | undefined;
            let characteristicC2ForSubscribe: Characteristic | undefined;
            let additionalCommissioningRelatedData: ByteArray | undefined;

            for (const characteristic of characteristics) {
                // Loop through each characteristic and match them to the UUIDs that we know about.
                logger.debug("found characteristic:", characteristic.uuid);

                switch (characteristic.uuid) {
                    case BLE_MATTER_C1_CHARACTERISTIC_UUID:
                        logger.debug("found C1 characteristic");
                        characteristicC1ForWrite = characteristic;
                        break;

                    case BLE_MATTER_C2_CHARACTERISTIC_UUID:
                        logger.debug("found C2 characteristic");
                        characteristicC2ForSubscribe = characteristic;
                        break;

                    case BLE_MATTER_C3_CHARACTERISTIC_UUID:
                        logger.debug("found C3 characteristic");
                        if (hasAdditionalAdvertisementData) {
                            logger.debug("reading additional commissioning related data");
                            const characteristicWithValue = await service.readCharacteristic(characteristic.uuid);
                            if (characteristicWithValue.value !== null) {
                                additionalCommissioningRelatedData = ByteArray.fromBase64(
                                    characteristicWithValue.value,
                                );
                            } else {
                                logger.debug("no value in characteristic C3");
                            }
                        }
                }
            }

            if (!characteristicC1ForWrite || !characteristicC2ForSubscribe) {
                logger.debug("missing characteristics");
                continue;
            }

            this.openChannels.set(address, peripheral);
            return await ReactNativeBleChannel.create(
                peripheral,
                characteristicC1ForWrite,
                characteristicC2ForSubscribe,
                this.onMatterMessageListener,
                additionalCommissioningRelatedData,
            );
        }

        throw new BleError(`No Matter service found on peripheral ${peripheral.id}`);
    }

    onData(listener: (socket: Channel<ByteArray>, data: ByteArray) => void): Listener {
        this.onMatterMessageListener = listener;
        return {
            close: async () => await this.close(),
        };
    }

    async close() {
        for (const peripheral of this.openChannels.values()) {
            await peripheral.cancelConnection();
        }
    }
}

export class ReactNativeBleChannel implements Channel<ByteArray> {
    static async create(
        peripheral: Device,
        characteristicC1ForWrite: Characteristic,
        characteristicC2ForSubscribe: Characteristic,
        onMatterMessageListener: (socket: Channel<ByteArray>, data: ByteArray) => void,
        _additionalCommissioningRelatedData?: ByteArray,
    ): Promise<ReactNativeBleChannel> {
        let mtu = peripheral.mtu ?? 0;
        if (mtu > BLE_MAXIMUM_BTP_MTU) {
            mtu = BLE_MAXIMUM_BTP_MTU;
        }
        logger.debug(`Using MTU=${mtu} (Peripheral MTU=${peripheral.mtu})`);
        const btpHandshakeRequest = BtpCodec.encodeBtpHandshakeRequest({
            versions: BTP_SUPPORTED_VERSIONS,
            attMtu: mtu,
            clientWindowSize: BTP_MAXIMUM_WINDOW_SIZE,
        });
        logger.debug(`sending BTP handshake request: ${Logger.toJSON(btpHandshakeRequest)}`);
        characteristicC1ForWrite = await characteristicC1ForWrite.writeWithResponse(btpHandshakeRequest.toBase64());

        const btpHandshakeTimeout = Time.getTimer("BLE handshake timeout", BTP_CONN_RSP_TIMEOUT_MS, async () => {
            await peripheral.cancelConnection();
            logger.debug("Handshake Response not received. Disconnected from peripheral");
        }).start();

        logger.debug("subscribing to C2 characteristic");

        const { promise: handshakeResponseReceivedPromise, resolver } = createPromise<ByteArray>();

        let handshakeReceived = false;
        const handshakeSubscription = characteristicC2ForSubscribe.monitor((error, characteristic) => {
            if (error !== null || characteristic === null) {
                if (error instanceof ReactNativeBleError && error.errorCode === 2 && handshakeReceived) {
                    // Subscription got removed after handshake was received, all good
                    return;
                }
                logger.debug("Error while monitoring C2 characteristic", error);
                return;
            }
            const characteristicData = characteristic.value;
            if (characteristicData === null) {
                logger.debug("C2 characteristic value is null");
                return;
            }
            const data = ByteArray.fromBase64(characteristicData);
            logger.debug(`received first data on C2: ${data.toHex()}`);

            if (data[0] === 0x65 && data[1] === 0x6c && data.length === 6) {
                // Check if the first two bytes and length match the Matter handshake
                logger.info(`Received Matter handshake response: ${data.toHex()}.`);
                btpHandshakeTimeout.stop();
                resolver(data);
            }
        });

        const handshakeResponse = await handshakeResponseReceivedPromise;
        handshakeReceived = true;
        handshakeSubscription.remove();

        let connectionCloseExpected = false;
        const btpSession = await BtpSessionHandler.createAsCentral(
            new ByteArray(handshakeResponse),
            // callback to write data to characteristic C1
            async data => {
                characteristicC1ForWrite = await characteristicC1ForWrite.writeWithResponse(data.toBase64());
            },
            // callback to disconnect the BLE connection
            async () => {
                connectionCloseExpected = true;
                dataSubscription.remove();
                await peripheral.cancelConnection();
                logger.debug("disconnected from peripheral");
            },

            // callback to forward decoded and de-assembled Matter messages to ExchangeManager
            async data => {
                if (onMatterMessageListener === undefined) {
                    throw new InternalError(`No listener registered for Matter messages`);
                }
                onMatterMessageListener(bleChannel, data);
            },
        );

        const dataSubscription = characteristicC2ForSubscribe.monitor((error, characteristic) => {
            if (error !== null || characteristic === null) {
                if (error instanceof ReactNativeBleError && error.errorCode === 2 && connectionCloseExpected) {
                    // Subscription got removed and received, all good
                    return;
                }
                logger.debug("Error while monitoring C2 characteristic", error);
                return;
            }
            const characteristicData = characteristic.value;
            if (characteristicData === null) {
                logger.debug("C2 characteristic value is null");
                return;
            }
            const data = ByteArray.fromBase64(characteristicData);
            logger.debug(`received data on C2: ${data.toHex}`);

            void btpSession.handleIncomingBleData(new ByteArray(data));
        });

        const bleChannel = new ReactNativeBleChannel(peripheral, btpSession);
        return bleChannel;
    }

    private connected = true;
    private disconnectSubscription: Subscription;
    readonly maxPayloadSize = BLE_MAX_MATTER_PAYLOAD_SIZE;
    readonly isReliable = true; // BTP is reliable

    constructor(
        private readonly peripheral: Device,
        private readonly btpSession: BtpSessionHandler,
    ) {
        this.disconnectSubscription = peripheral.onDisconnected(error => {
            logger.debug(`Disconnected from peripheral ${peripheral.id}: ${error}`);
            this.connected = false;
            this.disconnectSubscription.remove();
            void this.btpSession.close();
        });
    }

    /**
     * Send a Matter message to the connected device - need to do BTP assembly first.
     *
     * @param data
     */
    async send(data: ByteArray) {
        if (!this.connected) {
            logger.debug("Cannot send data because not connected to peripheral.");
            return;
        }
        if (this.btpSession === undefined) {
            throw new BtpFlowError(`Cannot send data, no BTP session initialized`);
        }
        await this.btpSession.sendMatterMessage(data);
    }

    // Channel<ByteArray>
    get name() {
        return `ble://${this.peripheral.id}`;
    }

    async close() {
        await this.btpSession.close();
        this.disconnectSubscription.remove();
        await this.peripheral.cancelConnection();
    }
}

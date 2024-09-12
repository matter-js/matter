/**
 * @license
 * Copyright 2022-2024 Matter.js Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { NetworkError } from "../Network.js";
import { TransportInterface } from "../TransportInterface.js";
import { MAX_UDP_MESSAGE_SIZE, UdpChannel, UdpChannelOptions } from "../UdpChannel.js";
import { MockNetwork } from "./MockNetwork.js";
import { NetworkSimulator } from "./NetworkSimulator.js";

export class MockUdpChannel implements UdpChannel {
    static async create(
        network: MockNetwork,
        { listeningAddress, listeningPort, netInterface, type }: UdpChannelOptions,
    ) {
        const { ipV4, ipV6 } = network.getIpMac(netInterface ?? NetworkSimulator.INTERFACE_NAME);
        const localAddress = type === "udp4" ? ipV4[0] : (ipV6[0] ?? ipV4[0]);
        if (localAddress === undefined) {
            throw new NetworkError("No matching IP on the specified interface");
        }
        return new MockUdpChannel(localAddress, listeningAddress, listeningPort);
    }

    private readonly netListeners = new Array<TransportInterface.Listener>();
    private readonly simulatedNetwork = NetworkSimulator.get();
    private readonly listeningPort: number;
    readonly maxPayloadSize = MAX_UDP_MESSAGE_SIZE;

    constructor(
        private readonly localAddress: string,
        private readonly listeningAddress: string | undefined,
        listeningPort?: number,
    ) {
        this.listeningPort = listeningPort ?? 1024 + Math.floor(Math.random() * 64511); // Random port 1024-65535
    }

    onData(listener: (netInterface: string, peerAddress: string, peerPort: number, data: Uint8Array) => void) {
        const netListener = this.simulatedNetwork.onUdpData(this.listeningAddress, this.listeningPort, listener);
        this.netListeners.push(netListener);
        return netListener;
    }

    async send(host: string, port: number, data: Uint8Array) {
        this.simulatedNetwork.sendUdp(this.localAddress, this.listeningPort, host, port, data);
    }

    async close() {
        for (const netListener of this.netListeners) {
            await netListener.close();
        }
        this.netListeners.length = 0;
    }

    async [Symbol.asyncDispose]() {
        return this.close();
    }

    get port() {
        return this.listeningPort;
    }
}

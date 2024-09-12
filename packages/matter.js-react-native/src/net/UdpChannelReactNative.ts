/**
 * @license
 * Copyright 2022-2024 Matter.js Authors
 * SPDX-License-Identifier: Apache-2.0
 */
import dgram from "react-native-udp";

import {
    Diagnostic,
    Logger,
    MAX_UDP_MESSAGE_SIZE,
    NetworkError,
    UdpChannel,
    UdpChannelOptions,
} from "@project-chip/matter.js-general";
import { NetworkReactNative } from "./NetworkReactNative.js";

const logger = Logger.get("UdpChannelNode");

// Move out some dram types not available in react-native-udp
// TODO find a way to clean that up once anything is working
interface RemoteInfo {
    address: string;
    family: "IPv4" | "IPv6";
    port: number;
    size: number;
}
type SocketType = "udp4" | "udp6";
interface SocketOptions {
    type: SocketType;
    reuseAddr?: boolean | undefined;
    /**
     * @default false
     */
    ipv6Only?: boolean | undefined;
    recvBufferSize?: number | undefined;
    sendBufferSize?: number | undefined;
    lookup?:
        | ((
              hostname: string,
              options: any,
              callback: (err: Error | null, address: string, family: number) => void,
          ) => void)
        | undefined;
}
interface Socket {
    setBroadcast(flag: boolean): void;
    setMulticastInterface(interfaceAddress: string): void;
    addMembership(multicastAddress: string, multicastInterface?: string): void;
    on(event: "message", listener: (msg: Uint8Array, rinfo: RemoteInfo) => void): void;
    on(event: "error", listener: (error: Error) => void): void;
    removeListener(event: "message", listener: (msg: Uint8Array, rinfo: RemoteInfo) => void): void;
    removeListener(event: "error", listener: (error: Error) => void): void;
    send(msg: Uint8Array, port: number, address: string, callback: (error: Error | null) => void): void;
    close(): void;
    address(): { address: string; port: number };
}

function createDgramSocket(host: string | undefined, port: number | undefined, options: SocketOptions) {
    // @ts-expect-error default types are strange
    const socket = dgram.createSocket({
        ...options,
        reusePort: options.reuseAddr,
    });
    return new Promise<Socket>((resolve, reject) => {
        const handleBindError = (error: Error) => {
            try {
                socket.close();
            } catch (error) {
                logger.debug("Error on closing socket", error);
            }
            reject(error);
        };
        socket.on("error", handleBindError);
        socket.bind(port, host, (error: any) => {
            if (error) return;
            const { address: localHost, port: localPort } = socket.address();
            logger.debug(
                "Socket created and bound ",
                Diagnostic.dict({
                    remoteAddress: `${host}:${port}`,
                    localAddress: `${localHost}:${localPort}`,
                }),
            );
            socket.removeListener("error", handleBindError);
            socket.on("error", (error: Error) => logger.error(error));
            resolve(socket);
        });
    });
}

export class UdpChannelReactNative implements UdpChannel {
    static async create({
        listeningPort,
        type,
        listeningAddress,
        netInterface,
        membershipAddresses,
    }: UdpChannelOptions) {
        const socketOptions: SocketOptions = { type, reuseAddr: true };
        if (type === "udp6") {
            socketOptions.ipv6Only = true;
        }
        const socket = await createDgramSocket(listeningAddress, listeningPort, socketOptions);
        socket.setBroadcast(true);
        let netInterfaceZone: string | undefined;
        if (netInterface !== undefined) {
            netInterfaceZone = netInterface;
            let multicastInterface: string | undefined;
            if (type === "udp4") {
                multicastInterface = await NetworkReactNative.getMulticastInterfaceIpv4(netInterface);
                if (multicastInterface === undefined) {
                    throw new NetworkError(`No IPv4 addresses on interface: ${netInterface}`);
                }
            } else {
                multicastInterface = `::%${netInterfaceZone}`;
            }
            logger.debug(
                "Initialize multicast",
                Diagnostic.dict({
                    address: `${multicastInterface}:${listeningPort}`,
                    interface: netInterface,
                    type: type,
                }),
            );
            socket.setMulticastInterface(multicastInterface);
        }
        if (membershipAddresses !== undefined) {
            const multicastInterfaces = await NetworkReactNative.getMembershipMulticastInterfaces(
                netInterface,
                type === "udp4",
            );
            for (const address of membershipAddresses) {
                for (const multicastInterface of multicastInterfaces) {
                    try {
                        socket.addMembership(address, multicastInterface);
                    } catch (error) {
                        logger.warn(
                            `Error adding membership for address ${address}${
                                multicastInterface ? ` with interface ${multicastInterface}` : ""
                            }: ${error}`,
                        );
                    }
                }
            }
        }
        return new UdpChannelReactNative(socket, netInterfaceZone);
    }

    readonly maxPayloadSize = MAX_UDP_MESSAGE_SIZE;

    constructor(
        private readonly socket: Socket,
        private readonly netInterface?: string,
    ) {}

    onData(listener: (netInterface: string, peerAddress: string, peerPort: number, data: Uint8Array) => void) {
        const messageListener = async (data: Uint8Array, { address, port }: RemoteInfo) => {
            const netInterface = this.netInterface ?? (await NetworkReactNative.getNetInterfaceForIp(address));
            if (netInterface === undefined) return;
            listener(netInterface, address, port, data);
        };

        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        this.socket.on("message", messageListener);
        return {
            close: async () => {
                // eslint-disable-next-line @typescript-eslint/no-misused-promises
                this.socket.removeListener("message", messageListener);
            },
        };
    }

    async send(host: string, port: number, data: Uint8Array) {
        return new Promise<void>((resolve, reject) => {
            this.socket.send(data, port, host, error => {
                if (error !== null) {
                    const netError = new NetworkError(error.message);
                    netError.stack = error.stack;
                    reject(netError);
                    return;
                }
                resolve();
            });
        });
    }

    async close() {
        try {
            this.socket.close();
        } catch (error) {
            logger.debug("Error on closing socket", error);
        }
    }

    get port() {
        return this.socket.address().port;
    }
}

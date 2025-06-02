/**
 * @license
 * Copyright 2022-2025 Matter.js Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MaybePromise } from "#util/index.js";
import { ChannelType } from "./Channel.js";
import { TransportInterface } from "./TransportInterface.js";

/** @see {@link MatterSpecification.v12.Core} § 4.4.4 */
export const MAX_UDP_MESSAGE_SIZE = 1280 - 48; // 48 bytes IP and UDP header size for IPv6

export type UdpSocketType = "udp4" | "udp6";

export interface UdpChannelOptions {
    listeningPort?: number;
    type: UdpSocketType;
    listeningAddress?: string;
    netInterface?: string;
}

export interface UdpChannel {
    maxPayloadSize: number;
    addMembership(address: string): MaybePromise<void>;
    dropMembership(address: string): MaybePromise<void>;
    onData(
        listener: (netInterface: string | undefined, peerAddress: string, peerPort: number, data: Uint8Array) => void,
    ): TransportInterface.Listener;
    send(host: string, port: number, data: Uint8Array): Promise<void>;
    close(): Promise<void>;
    get port(): number;
    supports(type: ChannelType, address?: string): boolean;
}

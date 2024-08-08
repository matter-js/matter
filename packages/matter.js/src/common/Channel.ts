/**
 * @license
 * Copyright 2022-2024 Matter.js Authors
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Channel<T> {
    /** Maximum Payload size for this channel */
    maxPayloadSize: number;

    /** Is the transport Reliable? UDP is not, TCP and BTP are. */
    isReliable: boolean;

    /** Channel name */
    name: string;

    /** Method to send data to the remote endpoint */
    send(data: T): Promise<void>;

    /** Method to close the channel */
    close(): Promise<void>;
}

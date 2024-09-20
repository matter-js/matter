/**
 * @license
 * Copyright 2022-2024 Matter.js Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Channel } from "./Channel.js";
import { ServerAddress } from "./ServerAddress.js";
import { TransportInterface } from "./TransportInterface.js";

/**
 * A Network interface enhances a TransportInterface with the ability to open a channel to a remote server.
 */
export interface NetInterface extends TransportInterface {
    openChannel(address: ServerAddress): Promise<Channel<Uint8Array>>;
}

export function isNetworkInterface(obj: TransportInterface | NetInterface): obj is NetInterface {
    return "openChannel" in obj;
}

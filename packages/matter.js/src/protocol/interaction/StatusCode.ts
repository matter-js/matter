/**
 * @license
 * Copyright 2022-2024 Matter.js Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Status } from "../../cluster/globals/Status.js";
import { MatterError } from "../../common/MatterError.js";

export const StatusCode = Status;
export type StatusCode = Status;

/** Error base Class for all errors related to the status response messages. */
export class StatusResponseError extends MatterError {
    public constructor(
        message: string,
        public readonly code: StatusCode,
        public readonly clusterCode?: number,
    ) {
        super();

        this.message = `(${code}) ${message}`;
    }
}

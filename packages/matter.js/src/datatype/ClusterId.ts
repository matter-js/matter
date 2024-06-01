/**
 * @license
 * Copyright 2022-2024 Matter.js Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { tryCatch } from "../common/TryCatchHandler.js";
import { ValidationError } from "../common/ValidationError.js";
import { TlvUInt32 } from "../tlv/TlvNumber.js";
import { TlvWrapper } from "../tlv/TlvWrapper.js";
import { Branded } from "../util/Type.js";
import { asMEI, fromMEI } from "./ManufacturerExtensibleIdentifier.js";
import { VendorId } from "./VendorId.js";

/**
 * A Cluster Identifier is a 32 bit number and SHALL reference a single cluster specification and
 * SHALL define conformance to that specification.
 *
 * @see {@link MatterSpecification.v10.Core} § 7.10
 */
export type ClusterId = Branded<number, "ClusterId">;

export function ClusterId(clusterId: number, validate = true): ClusterId {
    if (!validate) {
        return clusterId as ClusterId;
    }
    const { vendorPrefix, typeSuffix } = fromMEI(clusterId);
    if (
        (typeSuffix >= 0 && typeSuffix <= 0x7fff && vendorPrefix === 0) || // Standard cluster
        (typeSuffix >= 0xfc00 && typeSuffix <= 0xfffe && vendorPrefix !== 0) // Manufacturer specific cluster
    ) {
        return clusterId as ClusterId;
    }
    throw new ValidationError(`Invalid cluster ID: ${clusterId}`);
}

export namespace ClusterId {
    export const isVendorSpecific = (clusterId: ClusterId): boolean => {
        return tryCatch(
            () => {
                const { vendorPrefix } = fromMEI(clusterId);
                return vendorPrefix !== 0;
            },
            ValidationError,
            false,
        );
    };

    export const isValid = (clusterId: number): clusterId is ClusterId => {
        return tryCatch(
            () => {
                ClusterId(clusterId);
                return true;
            },
            ValidationError,
            false,
        );
    };

    export const buildVendorSpecific = (vendorPrefix: VendorId, clusterSuffix: number) => {
        return ClusterId(asMEI(vendorPrefix, clusterSuffix));
    };
}

/** Tlv schema for a cluster Id. */
export const TlvClusterId = new TlvWrapper<ClusterId, number>(
    TlvUInt32,
    clusterId => clusterId,
    value => ClusterId(value, false), // No automatic validation on decode
);

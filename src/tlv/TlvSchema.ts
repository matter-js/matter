/**
 * @license
 * Copyright 2022 Project CHIP Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ByteArray } from "../util/ByteArray.js";
import { DataReaderLE } from "../util/DataReaderLE.js";
import { DataWriterLE } from "../util/DataWriterLE.js";
import { Schema } from "../util/schema/Schema.js";
import { TlvTag, TlvTypeLength } from "./TlvCodec.js";

export abstract class TlvSchema<T> extends Schema<T, ByteArray> {
    /** @override */
    protected decodeInternal(encoded: ByteArray): T {
        return this.decodeTlv(new DataReaderLE(encoded)).value;
    }

    /** @override */
    protected encodeInternal(value: T): ByteArray {
        const writer = new DataWriterLE();
        this.encodeTlv(writer, value);
        return writer.toBuffer();
    }

    /** Decodes a TLV tag and value. */
    abstract decodeTlv(reader: DataReaderLE): { value: T, tag: TlvTag};

    /** Decodes a TLV value. */
    abstract decodeTlvValue(reader: DataReaderLE, typeLength: TlvTypeLength): T;

    /** Encodes a TLV tag and value. */
    abstract encodeTlv(writer: DataWriterLE, value: T, tag?: TlvTag): void;
}

export type LengthConstraints = {
    minLength?: number,
    maxLength?: number,
    length?: number,
};

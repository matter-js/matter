/**
 * @license
 * Copyright 2022-2023 Project CHIP Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from "assert";
import { BtpCodec } from "../../src/codec/BtpCodec.js";
import { ByteArray } from "../../src/util/ByteArray.js";

const DECODED_HANDSHAKE_REQUEST = {
    versions: [4], // 00000040
    attMtu: 185, // 00b9
    clientWindowSize: 6,
}

const DECODED_HANDSHAKE_REQUEST_WITH_MULTIPLE_VERSIONS = {
    versions: [4, 5, 6],
    attMtu: 185,
    clientWindowSize: 6,
}

const DECODED_HANDSHAKE_RESPONSE = {
    version: 4,
    attMtu: 256,
    windowSize: 6,
}

const DECODED_PAYLOAD = {
    header: {
        isHandshakeRequest: false,
        hasManagementOpcode: false,
        hasAckNumber: true,
        isEndingSegment: true,
        isBeginningSegment: true
    },
    payload: {
        ackNumber: 0,
        sequenceNumber: 0,
        messageLength: 0x44,
        segmentPayload: ByteArray.fromHex("0400000049b6a902a9a5773dbb8cafd90120a7c7000015300120cb0c120a3499327ddaec4ebe60889df0f1bf80d8a4dea1dd6ffef16ef58ecafe25028e17240300280418"),
    }
}

describe("BtpCodec", () => {
    describe("decode", () => {
        it("decodes a valid request handshake message", () => {
            const result = BtpCodec.decodeBtpHandshakeRequest(ByteArray.fromHex("656c04000000b90006"));

            assert.deepEqual(result, DECODED_HANDSHAKE_REQUEST);
        });

        it("decodes a valid request handshake message with multiple versions", () => {
            const result = BtpCodec.decodeBtpHandshakeRequest(ByteArray.fromHex("656c04560000b90006"));

            assert.deepEqual(result, DECODED_HANDSHAKE_REQUEST_WITH_MULTIPLE_VERSIONS);
        });

        it("decodes a valid btp packet PDU", () => {
            const result = BtpCodec.decodeBtpPacket(ByteArray.fromHex("0d000044000400000049b6a902a9a5773dbb8cafd90120a7c7000015300120cb0c120a3499327ddaec4ebe60889df0f1bf80d8a4dea1dd6ffef16ef58ecafe25028e17240300280418"));

            assert.deepEqual(result, DECODED_PAYLOAD);
        });
    });

    describe("encode", () => {
        it("encodes a valid response handshake message", () => {
            const result = BtpCodec.encodeBtpHandshakeResponse(DECODED_HANDSHAKE_RESPONSE);

            assert.deepEqual(result, ByteArray.fromHex("656c04000106"));
        });
    });

    describe("Errors", () => {
        it("incorrect headers in handshake request", () => {
            expect(() => BtpCodec.decodeBtpHandshakeRequest(ByteArray.fromHex("0d6c04000000b90006")))
                .toThrowError("BTPHandshake Request Headers is incorrect");
        });

        it("incorrect management opcode in handshake request", () => {
            expect(() => BtpCodec.decodeBtpHandshakeRequest(ByteArray.fromHex("656d04000000b90006")))
                .toThrowError("Management Opcode for BTPHandshake Request is incorrect");
        });

        it("no valid version provided in request handshake", () => {
            expect(() => BtpCodec.decodeBtpHandshakeRequest(ByteArray.fromHex("656c00000000b90006")))
                .toThrowError("No valid version provided");
        });

        it("opcode expected but not provided error in decoding the header", () => {
            expect(() => BtpCodec.decodeBtpPacket(ByteArray.fromHex("65000044000400000049b6a902a9a5773dbb8cafd90120a7c7000015300120cb0c120a3499327ddaec4ebe60889df0f1bf80d8a4dea1dd6ffef16ef58ecafe25028e17240300280418")))
                .toThrowError("Management Opcode for BTPHandshake Request is not expected");
        });
    });
});

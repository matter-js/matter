/**
 * @license
 * Copyright 2022-2024 Matter.js Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { UnexpectedDataError } from "../../src/common/MatterError.js";
import { CaseAuthenticatedTag } from "../../src/datatype/CaseAuthenticatedTag.js";
import { NodeId } from "../../src/datatype/NodeId.js";

describe("NodeId", () => {
    it("should create a valid NodeId as BigInt", () => {
        const nodeId = NodeId(BigInt(0x10001));
        expect(nodeId).to.equal(BigInt(0x10001));
    });

    it("should create a valid NodeId as number", () => {
        const nodeId = NodeId(0x10001);
        expect(nodeId).to.equal(0x10001);
    });

    it("should throw an error when creating a NodeId with negative value", () => {
        expect(() => NodeId(BigInt(-1))).to.throw(UnexpectedDataError);
    });

    it("should generate a random operational NodeId", () => {
        const nodeId = NodeId.randomOperationalNodeId();
        expect(nodeId).to.be.a("bigint");
    });

    it("should create a NodeId from a group NodeId", () => {
        const nodeId = NodeId.fromGroupNodeId(0x1234);
        expect(nodeId).to.be.a("bigint");
    });

    it("should throw an error when creating a NodeId from a group NodeId with negative value", () => {
        expect(() => NodeId.fromGroupNodeId(-1)).to.throw(UnexpectedDataError);
    });

    it("should create a NodeId from a temporary local NodeId", () => {
        const nodeId = NodeId.fromTemporaryLocalNodeId(0x12345678);
        expect(nodeId).to.be.a("bigint");
    });

    it("should throw an error when creating a NodeId from a temporary local NodeId with negative value", () => {
        expect(() => NodeId.fromTemporaryLocalNodeId(-1)).to.throw(UnexpectedDataError);
    });

    it("should create a NodeId from a CASE authenticated tag", () => {
        const nodeId = NodeId.fromCaseAuthenticatedTag(CaseAuthenticatedTag(0x12345678));
        expect(nodeId).to.be.a("bigint");
    });

    it("should successfully extract CASE authenticated tag", () => {
        const cat = NodeId.extractAsCaseAuthenticatedTag(NodeId(BigInt("0xFFFFFFFD0011002A")));
        expect(cat).equals(0x11002a);
        expect(CaseAuthenticatedTag.getVersion(cat)).equals(0x002a);
        expect(CaseAuthenticatedTag.getIdentifyValue(cat)).equals(0x0011);
    });

    it("should throw an error when creating a NodeId from a CASE authenticated tag with negative value", () => {
        expect(() => NodeId.fromCaseAuthenticatedTag(CaseAuthenticatedTag(-1))).to.throw(UnexpectedDataError);
    });

    it("should create a NodeId from a PAKE key identifier", () => {
        const nodeId = NodeId.getFromPakeKeyIdentifier(0x12345678);
        expect(nodeId).to.be.a("bigint");
    });

    it("should throw an error when creating a NodeId from a PAKE key identifier with negative value", () => {
        expect(() => NodeId.getFromPakeKeyIdentifier(-1)).to.throw(UnexpectedDataError);
    });
});

/**
 * @license
 * Copyright 2022-2023 Project CHIP Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IndexBehavior } from "../../../src/behavior/system/index/IndexBehavior.js";
import { Part } from "../../../src/endpoint/Part.js";
import { PartLifecycle } from "../../../src/endpoint/part/PartLifecycle.js";
import { MockEndpoint } from "../../behavior/mock-behavior.js";
import { MockPart } from "../mock-part.js";

function createParent() {
    return new MockPart(MockEndpoint, { number: 1 });
}

function createParentAndChild() {
    return new MockPart(MockEndpoint, { number: 2, owner: undefined });
}

function createChild() {
    return new MockPart(MockEndpoint, { number: 3, owner: undefined });
}

async function assembleIncrementally(assemble: (child: Part, parent: Part, grandparent: Part) => Promise<void>) {
    const grandparent = new MockPart(MockEndpoint);
    const parent = new MockPart(MockEndpoint, { owner: undefined });
    const child = new MockPart(MockEndpoint, { owner: undefined });

    await assemble(child, parent, grandparent);

    await child.construction;

    expect(grandparent.number).equals(1);
    expect(parent.number).equals(2);
    expect(child.number).equals(3);
}

describe("Parts", () => {
    it("adopts parts", async () => {
        const parent = createParent();
        await parent.construction;
        const child = createChild();

        const parts = parent.parts;
        parts.add(child);
        await child.construction;

        expect(parts.size).equals(1);
        expect(child.owner).equals(parent);
    });

    it("disowns destroyed parts", async () => {
        const parent = createParent();
        const child = createChild();

        const parts = parent.parts;
        parts.add(child);
        await child.construction;

        expect(parts.size).equals(1);

        await child.destroy();

        expect(parts.size).equals(0);
    });

    it("bubbles initialization", async () => {
        const parent = createParent();
        await parent.construction;

        const child = createParentAndChild();
        const grandchild = createChild();

        parent.parts.add(child);
        await child.construction;

        const bubbled = Array<PartLifecycle.Change>();
        parent.lifecycle.changed.on((type, part) => {
            expect(part).equals(grandchild);
            bubbled.push(type);
        });

        child.parts.add(grandchild);
        await grandchild.construction;

        expect(bubbled).deep.equals([
            PartLifecycle.Change.Installed,
            PartLifecycle.Change.IdAssigned,
            PartLifecycle.Change.TreeReady,
            PartLifecycle.Change.Ready,
        ]);
    });

    it("bubbles destruction", async () => {
        const parent = createParent();
        await parent.construction;

        const child = createParentAndChild();
        const grandchild = createChild();

        parent.parts.add(child);
        await child.construction;

        child.parts.add(grandchild);
        await grandchild.construction;

        let bubbled: Part | undefined;
        parent.lifecycle.changed.on((type, part) => {
            expect(type).equals(PartLifecycle.Change.Destroyed);
            bubbled = part;
        });

        await grandchild.destroy();

        expect(bubbled).equals(grandchild);
    });

    it("supports incremental descendant-first tree assembly", async () => {
        await assembleIncrementally(async (child, parent, grandparent) => {
            parent.parts.add(child);
            grandparent.parts.add(parent);
        });
    });

    it("supports incremental descendant-first tree assembly", async () => {
        await assembleIncrementally(async (child, parent, grandparent) => {
            parent.parts.add(child);
            grandparent.parts.add(parent);
        });
    });

    it("supports incremental ancestor-first tree assembly with index", async () => {
        await assembleIncrementally(async (child, parent, grandparent) => {
            parent.behaviors.require(IndexBehavior);
            grandparent.parts.add(parent);
            parent.parts.add(child);
        });
    });

    it("supports incremental descendant-first tree assembly with index", async () => {
        await assembleIncrementally(async (child, parent, grandparent) => {
            parent.behaviors.require(IndexBehavior);
            parent.parts.add(child);
            grandparent.parts.add(parent);
        });
    });
});

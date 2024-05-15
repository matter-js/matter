/**
 * @license
 * Copyright 2022-2024 Matter.js Authors
 * SPDX-License-Identifier: Apache-2.0
 */

// Include this first to auto-register Crypto, Network and Time Node.js implementations
import "@project-chip/matter-node.js";

import {
    MovementDirection,
    MovementType,
    WindowCoveringServer,
} from "@project-chip/matter.js/behaviors/window-covering";
import { OnOffLightDevice, OnOffLightRequirements } from "@project-chip/matter.js/devices/OnOffLightDevice";
import { WindowCoveringDevice } from "@project-chip/matter.js/devices/WindowCoveringDevice";
import { ServerNode } from "@project-chip/matter.js/node";

/**
 * This example demonstrates implementation of a "composed" device comprising multiple sub-devices
 *
 * Our example device, the Excelsior 1000 EZ-Nite™, is a roller shade with an illuminated valance.
 */

const LiftingWindowCoveringServer = WindowCoveringServer.with("Lift", "AbsolutePosition", "PositionAwareLift");

/**
 * Implementation of the Matter WindowCovering cluster for the shade motor.
 */
class RollerShade extends LiftingWindowCoveringServer {
    override async handleMovement(
        type: MovementType,
        reversed: boolean,
        direction: MovementDirection,
        targetPercent100ths?: number,
    ) {
        console.log(
            "Move window shade",
            direction === MovementDirection.Open ? "Open" : "Close",
            targetPercent100ths !== undefined ? `${targetPercent100ths / 100}%` : "",
        );

        // Updates the shade position
        await super.handleMovement(type, reversed, direction, targetPercent100ths);
    }
}

/**
 * Implementation of the OnOff cluster for our valance light.
 */
class ValanceLight extends OnOffLightRequirements.OnOffServer {
    override initialize() {
        this.reactTo(this.events.onOff$Changed, this.#stateChanged);
    }

    #stateChanged(value: boolean) {
        console.log(`Valance is now ${value ? "illuminated" : "dark"}`);
    }
}

/**
 * Our Matter node.
 */
const node = new ServerNode({
    id: "excelsior1000",

    productDescription: {},

    commissioning: {
        passcode: 20202021,
        discriminator: 3840,
    },

    basicInformation: {
        vendorName: "Acme Corporation",
        productName: "Excelsior 1000 EZ-Nite™",
        vendorId: 0xfff1,
        productId: 0x8000,
        serialNumber: "1234-12345-123",
    },

    parts: [
        {
            type: WindowCoveringDevice.with(RollerShade),
            id: "shade",
        },

        {
            type: OnOffLightDevice.with(ValanceLight),
            id: "valance",
        },
    ],
});

await node.run();

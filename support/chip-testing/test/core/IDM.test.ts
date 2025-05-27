/**
 * @license
 * Copyright 2022-2025 Matter.js Authors
 * SPDX-License-Identifier: Apache-2.0
 */

describe("IDM", () => {
    chip("IDM/*").exclude(
        // We fail conformance tests, mainly for groups though there are DoorLock and OccupancySensor issues too
        // TODO - revisit once we have groups
        "IDM/10.2",

        // IDM 10.4 in TC_pics_checker.py appears to fail because it needs an endpoint ID specified
        // TODO - we could look at wiring this but would need to select the endpoints to check and manually create runs
        // ...and if I was going to do anything automatically with PICS I would probably generate from device
        "IDM/10.4",
    );
    chip("IDM/*/run1");
});

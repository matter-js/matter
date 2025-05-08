/**
 * @license
 * Copyright 2022-2025 Matter.js Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { edit } from "@matter/testing";

describe("CADMIN", () => {
    // CADMIN 1.5 sleeps for 190 seconds to wait for commissioning timeout.  We've forced timeout to 1 second so we can
    // sleep for much less time.  We also then need to reduce the window timeout from 180s to 1s
    before(() =>
        chip.testFor("CADMIN/1.5").edit(
            edit.sed(
                // Reduce commissioning window time
                "s/timeout=180/timeout=1/",

                // Reduce sleep
                "s/sleep(190)/sleep(2)/",

                // Reduce commissioning timeout
                "s/setupPinCode=/discoveryTimeoutMsec=5000,setupPinCode=/",
            ),

            // Step 4 originally receives "CancelledError" because of some future cancellation...  With our shortened
            // timeouts the CHIP error occurs first, which is the same as step 7 expects; correct the test
            edit.insert({
                after: /async def commission_on_network/,
                lines: "        expected_error = 50",
            }),
        ),
    );

    // CHIP expects general error code 0xb when the proper response is NodeOperationalCertStatus.TableFull
    //
    // For now we just patch the test to convert 0xb (whatever that is) to 0x587, which appears to be an internal
    // encoding for ConstraintError (which is just 0x87, so presumably 0x500 is a bit prefix)
    before(() => chip.testFor("CADMIN/1.19").edit(edit.sed("s/0x0000000B/0x00000587/")));

    // For CADMIN/1.24 we reduce window timeout (see equivalent in SC/4.1)
    before(() => chip.testFor("CADMIN/1.24").edit(edit.sed("s/180/1/")));

    // Since our timeout is artificially low (1 s.) we need to reduce the timeout in the "discovery window too short"
    // test (see equivalent in Discovery.test.ts)
    before(() => chip.testFor("CADMIN/1.24").edit(edit.sed("s/timeout=179/timeout=0/")));

    chip("CADMIN/1.5");
    // chip("CADMIN/*").exclude(
    //     // Handled below
    //     "CADMIN/1.19",

    //     // TODO - we fail 1.24 because we open a second commissioning window.  Unsure why we shouldn't, requires more
    //     // research
    //     "CADMIN/1.24",
    // );

    // chip("CADMIN/1.19").beforeTest(subject => {
    //     const node = NodeTestInstance.nodeOf(subject);

    //     // CHIP has a hard-coded limit via CHIP_CONFIG_MAX_FABRICS macro which defaults to 16.  TC_ADMIN_1_19 fails
    //     // when we exhaust this space with our default fabric limit of 254.  Including a bug which lets the test
    //     // fail if limit is not 16, so set to 16 to be ok for now.
    //     return node.setStateOf(OperationalCredentialsBehavior, { supportedFabrics: 16 });
    // });
});

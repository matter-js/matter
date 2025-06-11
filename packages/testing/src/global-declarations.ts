/**
 * @license
 * Copyright 2022-2025 Matter.js Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import type Chai from "chai";
import "chai-as-promised";
import type { MockCrypto } from "./mocks/crypto.js";
import type { DiagnosticMessageLike, MockLogger } from "./mocks/logging.js";
import type { MockTime } from "./mocks/time.js";
import type { TestDescriptor, TestSuiteDescriptor } from "./test-descriptor.js";

declare global {
    // Expose Chai globally
    const expect: typeof Chai.expect;

    // Expose API for controlling time
    let MockTime: MockTime;

    // Expose API for controlling logging
    let MockLogger: MockLogger;

    // Expose API for controlling crypto
    let MockCrypto: MockCrypto;

    /**
     * If present, the following hooks are engaged by matter.js packages to enable mocking.  We use globals rather than
     * imports so we can hook the modules regardless of whether they're loaded as CommonJS or ESM.
     */
    let MatterHooks:
        | undefined
        | {
              /**
               * Abort test run.
               */
              interrupt(): void;

              /**
               * Set boot manager.
               */
              bootSetup(boot: { reboot(): void | Promise<void> }): void;

              /**
               * Configure time.
               */
              timeSetup?: (Time: any) => void;

              /**
               * Configure logging.
               */
              loggerSetup?: (Logger: any) => void;

              /**
               * Configure crypto.
               */
              cryptoSetup?: (Crypto: any) => void;

              /**
               * Receive intercepted log messages.
               */
              loggerSink?: (text: string, message: DiagnosticMessageLike) => void;

              /**
               * Extract error details.
               */
              messageAndStackFor?: (
                  error: unknown,
                  parentStack?: string[],
              ) => { message: string; id?: string; stack?: string; stackLines?: string[] };
          };

    namespace Mocha {
        interface Suite {
            readonly descriptor: TestSuiteDescriptor;
        }

        interface Test {
            descriptor: TestDescriptor;
        }
    }
}

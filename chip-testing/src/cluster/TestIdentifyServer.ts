/**
 * @license
 * Copyright 2022-2024 Matter.js Authors
 * SPDX-License-Identifier: Apache-2.0
 */
import { Logger } from "@matter.js/general";
import { IdentifyServer } from "@matter.js/main/behaviors/identify";
import { Identify } from "@matter.js/main/clusters/identify";

const logger = Logger.get("TestIdentifyServer");

export class TestIdentifyServer extends IdentifyServer {
    override triggerEffect(triggerEffectRequest: Identify.TriggerEffectRequest): void {
        const { effectIdentifier, effectVariant } = triggerEffectRequest;
        logger.info(`Triggering effect ${effectIdentifier} with variant ${effectVariant}`);
    }
}

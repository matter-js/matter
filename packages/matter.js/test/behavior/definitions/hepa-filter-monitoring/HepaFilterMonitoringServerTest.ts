/**
 * @license
 * Copyright 2022-2024 Matter.js Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HepaFilterMonitoringServer } from "../../../../src/behavior/definitions/hepa-filter-monitoring/HepaFilterMonitoringServer.js";
import { FanControl } from "../../../../src/cluster/definitions/FanControlCluster.js";
import { ResourceMonitoring } from "../../../../src/cluster/definitions/ResourceMonitoringCluster.js";
import { AirPurifierDevice } from "../../../../src/endpoint/definitions/device/AirPurifierDevice.js";
import { MockServerNode } from "../../../node/mock-server-node.js";

describe("HepaFilterMonitoringServer", () => {
    it("instantiates", async () => {
        const node = await MockServerNode.create();
        const DeviceType = AirPurifierDevice.with(HepaFilterMonitoringServer);
        await node.add(DeviceType, {
            fanControl: { fanModeSequence: FanControl.FanModeSequence.OffHigh, percentCurrent: 50 },
        });
        await node.close();
    });

    it("instantiates with feature", async () => {
        const node = await MockServerNode.create();
        const Filter = HepaFilterMonitoringServer.with("Condition");
        const PurifierDevice = AirPurifierDevice.with(Filter);
        const purifier = await node.add(PurifierDevice, {
            fanControl: { fanModeSequence: FanControl.FanModeSequence.OffHigh, percentCurrent: 50 },
            hepaFilterMonitoring: {
                condition: 100,
                degradationDirection: ResourceMonitoring.DegradationDirection.Down,
            },
        });
        await purifier.setStateOf(Filter, { condition: 50 });
        expect(purifier.stateOf(Filter).condition).equals(50);
    });

    it("properly types state", async () => {
        const node = await MockServerNode.create();
        const Filter = HepaFilterMonitoringServer.with("Condition");
        const PurifierDevice = AirPurifierDevice.with(Filter);
        const purifier = await node.add(PurifierDevice, {
            fanControl: { fanModeSequence: FanControl.FanModeSequence.OffHigh, percentCurrent: 50 },
            hepaFilterMonitoring: {
                condition: 100,
                degradationDirection: ResourceMonitoring.DegradationDirection.Down,
            },
        });
        await purifier.act(agent => {
            agent.hepaFilterMonitoring.state.condition = 50;
        });
        expect(purifier.stateOf(Filter).condition).equals(50);
    });
});

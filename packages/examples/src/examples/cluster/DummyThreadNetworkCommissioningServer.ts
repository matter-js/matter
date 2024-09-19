/**
 * @license
 * Copyright 2022-2024 Matter.js Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Bytes, Logger } from "@matter.js/main";
import { GeneralCommissioningBehavior } from "@matter.js/main/behaviors/general-commissioning";
import { NetworkCommissioningBehavior } from "@matter.js/main/behaviors/network-commissioning";
import { NetworkCommissioning } from "@matter.js/types/clusters";

const firstNetworkId = new Uint8Array(32);

/**
 * This represents a Dummy version of a Thread Network Commissioning Cluster Server without real thread related logic, beside
 * returning some values provided as CLI parameters. This dummy implementation is only there for tests/as showcase for BLE
 * commissioning of a device.
 */
export class DummyThreadNetworkCommissioningServer extends NetworkCommissioningBehavior.with(
    NetworkCommissioning.Feature.ThreadNetworkInterface,
) {
    override scanNetworks({
        breadcrumb,
    }: NetworkCommissioning.ScanNetworksRequest): NetworkCommissioning.ScanNetworksResponse {
        console.log(`---> scanNetworks called on NetworkCommissioning cluster: ${breadcrumb}`);

        // Simulate successful scan
        if (breadcrumb !== undefined) {
            const generalCommissioningCluster = this.agent.get(GeneralCommissioningBehavior);
            generalCommissioningCluster.state.breadcrumb = breadcrumb;
        }

        const networkingStatus = NetworkCommissioning.NetworkCommissioningStatus.Success;
        this.state.lastNetworkingStatus = networkingStatus;

        const threadScanResults = [
            {
                panId: this.endpoint.env.vars.number("ble.thread.panId"),
                extendedPanId: BigInt(this.endpoint.env.vars.string("ble.thread.extendedPanId")),
                networkName: this.endpoint.env.vars.string("ble.thread.networkName"),
                channel: this.endpoint.env.vars.number("ble.thread.channel"),
                version: 130,
                extendedAddress: Bytes.fromString(
                    (this.endpoint.env.vars.string("ble.thread.address") ?? "000000000000").toLowerCase(),
                ),
                rssi: -50,
                lqi: 50,
            },
        ];
        console.log(Logger.toJSON(threadScanResults));

        return {
            networkingStatus,
            threadScanResults,
        };
    }

    override addOrUpdateThreadNetwork({
        operationalDataset,
        breadcrumb,
    }: NetworkCommissioning.AddOrUpdateThreadNetworkRequest) {
        console.log(
            `---> addOrUpdateThreadNetwork called on NetworkCommissioning cluster: ${Bytes.toHex(operationalDataset)} ${breadcrumb}`,
        );

        this.session.context.assertFailSafeArmed("Failsafe timer needs to be armed to add or update networks.");

        // Simulate successful add or update
        if (breadcrumb !== undefined) {
            const generalCommissioningCluster = this.agent.get(GeneralCommissioningBehavior);
            generalCommissioningCluster.state.breadcrumb = breadcrumb;
        }

        const networkingStatus = NetworkCommissioning.NetworkCommissioningStatus.Success;
        this.state.lastNetworkingStatus = networkingStatus;
        this.state.lastNetworkId = firstNetworkId;

        return {
            networkingStatus,
            networkIndex: 0,
        };
    }

    override removeNetwork({ networkId, breadcrumb }: NetworkCommissioning.RemoveNetworkRequest) {
        console.log(
            `---> removeNetwork called on NetworkCommissioning cluster: ${Bytes.toHex(networkId)} ${breadcrumb}`,
        );

        this.session.context.assertFailSafeArmed("Failsafe timer needs to be armed to add or update networks.");

        // Simulate successful add or update
        if (breadcrumb !== undefined) {
            const generalCommissioningCluster = this.agent.get(GeneralCommissioningBehavior);
            generalCommissioningCluster.state.breadcrumb = breadcrumb;
        }

        const networkingStatus = NetworkCommissioning.NetworkCommissioningStatus.Success;
        this.state.lastNetworkingStatus = networkingStatus;
        this.state.lastNetworkId = firstNetworkId;

        return {
            networkingStatus,
            networkIndex: 0,
        };
    }

    override async connectNetwork({ networkId, breadcrumb }: NetworkCommissioning.ConnectNetworkRequest) {
        console.log(
            `---> connectNetwork called on NetworkCommissioning cluster: ${Bytes.toHex(networkId)} ${breadcrumb}`,
        );

        this.session.context.assertFailSafeArmed("Failsafe timer needs to be armed to add or update networks.");

        // Simulate successful connection
        if (breadcrumb !== undefined) {
            const generalCommissioningCluster = this.agent.get(GeneralCommissioningBehavior);
            generalCommissioningCluster.state.breadcrumb = breadcrumb;
        }

        this.state.networks[0].connected = true;

        const networkingStatus = NetworkCommissioning.NetworkCommissioningStatus.Success;
        this.state.lastNetworkingStatus = networkingStatus;
        this.state.lastNetworkId = firstNetworkId;
        this.state.lastConnectErrorValue = null;

        // Announce operational in IP network
        const device = this.session.context;
        await device.startAnnouncement();

        return {
            networkingStatus,
            errorValue: null,
        };
    }

    override reorderNetwork({ networkId, networkIndex, breadcrumb }: NetworkCommissioning.ReorderNetworkRequest) {
        console.log(
            `---> reorderNetwork called on NetworkCommissioning cluster: ${Bytes.toHex(networkId)} ${networkIndex} ${breadcrumb}`,
        );

        // Simulate successful connection
        if (breadcrumb !== undefined) {
            const generalCommissioningCluster = this.agent.get(GeneralCommissioningBehavior);
            generalCommissioningCluster.state.breadcrumb = breadcrumb;
        }

        const networkingStatus = NetworkCommissioning.NetworkCommissioningStatus.Success;
        this.state.lastNetworkingStatus = networkingStatus;

        return {
            networkingStatus,
            networkIndex: 0,
        };
    }
}

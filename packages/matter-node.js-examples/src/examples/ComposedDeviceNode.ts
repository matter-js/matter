/**
 * @license
 * Copyright 2022-2023 Project CHIP Authors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * This example shows how to create a new device node that is composed of multiple devices.
 * It creates multiple endpoints on the server. For information on how to add a composed device to a bridge please
 * refer to the bridge example!
 * It can be used as CLI script and starting point for your own device node implementation.
 */

/**
 * Import needed modules from @project-chip/matter-node.js
 */
// Include this first to auto-register Crypto, Network and Time Node.js implementations
import "@project-chip/matter-node.js";

import { NetworkCommissioning } from "@project-chip/matter-node.js/cluster";
import { DeviceTypeId, VendorId } from "@project-chip/matter-node.js/datatype";
import { logEndpoint } from "@project-chip/matter-node.js/device";
import { Logger } from "@project-chip/matter-node.js/log";
import { Time } from "@project-chip/matter-node.js/time";
import { requireMinNodeVersion } from "@project-chip/matter-node.js/util";
import { NetworkCommissioningServer } from "@project-chip/matter.js/behavior/definitions/network-commissioning";
import { OnOffLightDevice } from "@project-chip/matter.js/devices/OnOffLightDevice";
import { OnOffPlugInUnitDevice } from "@project-chip/matter.js/devices/OnOffPlugInUnitDevice";
import { Part, PartServer } from "@project-chip/matter.js/endpoint";
import { Environment, StorageService } from "@project-chip/matter.js/environment";
import { ServerNode } from "@project-chip/matter.js/node";
import { ByteArray } from "@project-chip/matter.js/util";
import { execSync } from "child_process";

const logger = Logger.get("Device");

/**
 * Gets a shell command from an environment variable and execute it and log the response
 */
function executeCommand(scriptParamName: string) {
    const script = environment.vars.string(scriptParamName);
    if (script === undefined) return undefined;
    console.log(`${scriptParamName}: ${execSync(script).toString().slice(0, -1)}`);
}

requireMinNodeVersion(16);

/**
 * Get the default Environment to access variables (command line parameters and environment), get a storage and such
 * convenient things used in this example.
 */
const environment = Environment.default;

/**
 * Collect all needed data
 *
 * This block collects all needed data from cli, environment or storage. Replace this with where ever your data come from.
 *
 * Note: This example uses the matter.js process storage system to store the device parameter data for convenience
 * and easy reuse. When you also do that be careful to not overlap with Matter-Server own storage contexts
 * (so maybe better not do it ;-)).
 */
const storageService = environment.get(StorageService);
logger.info(`Storage location: ${storageService.location} (Directory)`);
logger.info(
    'Use the parameter "--storage-path=NAME-OR-PATH" to specify a different storage location in this directory, use --storage-clear to start with an empty storage.',
);
const deviceStorage = (await storageService.open("device")).createContext("data");

const isSocket = deviceStorage.get("isSocket", environment.vars.get("type") === "socket");
if (deviceStorage.has("isSocket")) {
    logger.info(`Device type ${isSocket ? "socket" : "light"} found in storage. --type parameter is ignored.`);
}
const deviceName = "Matter test device";
const vendorName = "matter-node.js";
const passcode = environment.vars.number("passcode") ?? deviceStorage.get("passcode", 20202021);
const discriminator = environment.vars.number("discriminator") ?? deviceStorage.get("discriminator", 3840);
// product name / id and vendor id should match what is in the device certificate
const vendorId = environment.vars.number("vendorid") ?? deviceStorage.get("vendorid", 0xfff1);
const productName = `node-matter OnOff ${isSocket ? "Socket" : "Light"}`;
const productId = environment.vars.number("productid") ?? deviceStorage.get("productid", 0x8000);

const port = environment.vars.number("port") ?? 5540;

const uniqueId = environment.vars.string("uniqueid") ?? deviceStorage.get("uniqueid", Time.nowMs().toString());

// Persist basic data to keep them also on restart
deviceStorage.set("passcode", passcode);
deviceStorage.set("discriminator", discriminator);
deviceStorage.set("vendorid", vendorId);
deviceStorage.set("productid", productId);
deviceStorage.set("isSocket", isSocket);
deviceStorage.set("uniqueid", uniqueId);

const networkId = new ByteArray(32);
/**
 * Create a Matter ServerNode, which contains the Root Endpoint and all relevant data and configuration
 */
const server = await ServerNode.create(
    ServerNode.RootEndpoint.with(
        NetworkCommissioningServer.with(NetworkCommissioning.Feature.EthernetNetworkInterface),
    ),
    {
        // Give the Node a unique ID which is used to store the state of this node
        id: uniqueId,

        // Provide Network relevant configuration like the port
        network: {
            port,
        },

        // Provide Commissioning relevant settings
        commissioning: {
            passcode,
            discriminator,
        },

        // Provide Node announcement settings
        productDescription: {
            name: deviceName,
            deviceType: DeviceTypeId(isSocket ? OnOffPlugInUnitDevice.deviceType : OnOffLightDevice.deviceType),
        },

        // Ethernet NetworkCommissioning data
        networkCommissioning: {
            maxNetworks: 1,
            interfaceEnabled: true,
            lastConnectErrorValue: 0,
            lastNetworkId: networkId,
            lastNetworkingStatus: NetworkCommissioning.NetworkCommissioningStatus.Success,
            networks: [{ networkId: networkId, connected: true }],
        },

        // Provide defaults for the BasicInformation cluster on the Root endpoint
        basicInformation: {
            vendorName,
            vendorId: VendorId(vendorId),
            nodeLabel: productName,
            productName,
            productLabel: productName,
            productId,
            serialNumber: `matterjs-${uniqueId}`,
            uniqueId,
        },
    },
);

/**
 * Matter Nodes are a composition of endpoints. Create and add a single multiple endpoint to the node to make it a
 * composed device. This example uses the OnOffLightDevice or OnOffPlugInUnitDevice depending on the value of the type
 * parameter. It also assigns each Part a unique ID to store the endpoint number for it in the storage to restore the
 * device on restart.
 * In this case we directly use the default command implementation from matter.js. Check out the DeviceNodeFull example
 * to see how to customize the command handlers.
 */
const numDevices = environment.vars.number("num") || 2;
for (let i = 1; i <= numDevices; i++) {
    const isSocket = environment.vars.string(`type${i}`) === "socket";
    const part = new Part(isSocket ? OnOffPlugInUnitDevice : OnOffLightDevice, { id: `onoff-${i}` });
    await server.add(part);

    /**
     * Register state change handlers of the part for identify and onoff states to react to the commands.
     * If the code in these change handlers fail then the change is also rolled back and not executed and an error is
     * reported back to the controller.
     */
    let isIdentifying = false;
    part.events.identify.identifyTime$Change.on(value => {
        // identifyTime is set when an identify commandf is called and then decreased every second while indenitfy logic runs.
        if (value > 0 && !isIdentifying) {
            isIdentifying = true;
            logger.info(`OnOff ${i}: Run identify logic, ideally blink a light every 0.5s ...`);
        } else if (value === 0) {
            isIdentifying = false;
            logger.info(`OnOff ${i}: Stop identify logic ...`);
        }
    });

    part.events.onOff.onOff$Change.on(value => {
        executeCommand(value ? `on${i}` : `off${i}`);
        console.log(`OnOff ${i} is now ${value ? "ON" : "OFF"}`);
    });
}

/**
 * Log the endpoint structure for debugging reasons and to allow to verify anything is correct
 */
logEndpoint(PartServer.forPart(server));

/**
 * In order to start the node and announce it into the network we use the run method which resolves when the node goes
 * offline again because we do not need anything more here. See the Full example for other starting options.
 * The QR Code is printed automatically.
 */
await server.run();

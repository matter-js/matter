# matter-node.js

[![license](https://img.shields.io/badge/license-Apache2-green.svg?style=flat)](https://raw.githubusercontent.com/mfucci/node-matter/master/LICENSE) 

Matter protocol for node.js with no native dependencies (and very limited dependencies).

> This package requires Node 16+ for the required Crypto primitives

Matter is a new secure / reliable / local / standard protocol for smart devices launched at the end of 2022.
To know more about Matter: https://csa-iot.org/all-solutions/matter/

matter-node.js is compatible with:
- **iOS - Home app**: fully working, [screenshot](https://github.com/mfucci/node-matter/issues/103#issuecomment-1374301293)
- **Android - Home app**: fully working, [thread](https://github.com/mfucci/node-matter/issues/140#issuecomment-1374417228)
- **Alexa**: fully working, [screenshot](https://github.com/mfucci/node-matter/issues/159#issuecomment-1374323476)
- **Home Assistant**: fully working, [thread](https://github.com/mfucci/node-matter/issues/11)
- **Smartthings**: pairing works, but for controlling seems like Smartthings implementation itself has issues, [thread](https://github.com/mfucci/node-matter/issues/189)

Each system have their own specialities, see [Pairing and Usage Information](#Pairing-and-Usage-Information) for more details.

## Installation

### From NPM

```bash
npm i -g @project-chip/matter-node.js
```

### Use from Cloned Matter.js Repository

When you clone the matter.js repository you can also use matter-node.js. To do this you need to execute `npm install`in the matter.js root directory once to install all dependencies and build all packages.

Then after `cd packages/matter-node.js` you can use `npm run matter` to run the matter-node.js server. Please see the next section for more details.

## Usage

To run from the build files:

```bash
matter
```

To run directly from Typescript files with on the fly compilation:

```bash
npm run matter
```

This starts a Matter (Device) server listening on port 5540.

This first version only includes the OnOff cluster (on/off smart thing, like a plug or a bulb).
You can use -on and -off parameter to run a script to control something.
For instance, on a Raspberry Pi, this will turn on / off the red LED:

```bash
matter -on "echo 255 > /sys/class/leds/led1/brightness" -off "echo 0 > /sys/class/leds/led1/brightness"
```

or when starting from TS files:

```bash
npm run matter -- -on "echo 255 > /sys/class/leds/led1/brightness" -off "echo 0 > /sys/class/leds/led1/brightness"
```
(Please note the "--" to separate commandline parameters between the npm run and the executed script. 

The following parameters are available:
* -passcode: the passcode to use for pairing (default: 20202021)
* -discriminator: the discriminator to use for pairing (default: 3840)
* -vendorid: the vendor ID as number to use for pairing (default: 65521 (0xFFF1))
* -productid: the product ID as number to use for pairing (default: 32768 (0x8000))
* -announceinterface: limit mdns announcements to the provided network interface, e.g. "en0" (default: all interfaces available)
* -port: the port to listen on for the device (default: 5540)
* -store: the storage location (directory) to use for storing the pairing information (default: device-node). Delete the directory or provide an alternative name to reset the device
* -on: the command to run when the device is turned on (see example above)
* -off: the command to run when the device is turned off (see example above)

**Experimental**

To run from the build files:

```bash
matter-controller -ip [IP address of device to commission]
```

To run directly from Typescript files with on the fly compilation:

```bash
npm run matter-controller -- -ip [IP address of device to commission]
```

This will commission a Matter device (for debugging purpose only for now).

The following parameters are available:
* -ip: the IP address of the device to commission
* -discriminator: the discriminator to use for pairing (default: 3840)
* -pin: the pin to use for pairing (default: 20202021)
* -store: the storage location (directory) to use for storing the pairing information (default: controller-node). Delete the directory or provide an alternative name to reset the controller

## Modifying the server (Device) behavior

Device.ts defines the server behavior. You can add / remove clusters, change default parameters, etc...

```typescript
new MatterDevice()
    .addChannel(new UdpChannel(5540))
    .addProtocolHandler(Protocol.SECURE_CHANNEL, new SecureChannelHandler(
            new PasePairing(20202021, { iteration: 1000, salt: Crypto.getRandomData(32) }),
            new CasePairing(),
        ))
    .addProtocolHandler(Protocol.INTERACTION_MODEL, new InteractionProtocol(new Device([
        new Endpoint(0x00, "MA-rootdevice", [
            new BasicInformationCluster({ vendorName: "node-matter", vendorId: 0xFFF1, productName: "Matter test device", productId: 0X8001 }),
            new GeneralCommissioningCluster(),
            new OperationalCredentialsCluster(),
        ]),
        new Endpoint(0x01, "MA-OnOff", [
                new OnOffCluster(executor("on"), executor("off")),
        ]),
    ])))
    .start()
```

## Building

* `npm run build`: Build all code and create CommonJS and ES6 variants in dist directory. This will built incrementally and only build the changed files.
* `npm run build-clean`: Clean the dist directory and build all code from scratch

## Testing

* `npm run test`: Run all tests

## Pairing and Usage Information

It should work with any Matter-compatible home automation app when Matter will be released. We tested the Library with the "big" ones and can provide additional information.

A good guide with images on how to add devices to Alexa, Google and Apple in general is available in the [TP-Link FAQ](https://www.tp-link.com/de/support/faq/3564/).


### iOS Home
Minimum OS Required for iOS device: iOS16.2 or later.

Apple [support to set up HomePod, HomePod mini, Apple TV, or iPad](https://support.apple.com/en-us/HT207057) (will not be supported anymore 
with the new Home Architecture starting iOS 16.3!) as a Matter Hub. The pairing itself can also be done using an iPhone, but the later 
controlling can only be done by one of the Hub options listed above!

When pairing with node-matter the Home app will ask you to allow to pair an "uncertified device"which you need to allow. After that the device 
will be added to the Home app, and you can control it from there. 

We currently have no information which device types are supported by the Home app. But Lights and Sockets are support in any case.

Apple is using "two fabric IDs" on the paired devices (all others only use one). This needs to be considered when planning to pair devices with 
multiple controllers. How many fabrics are available depends on the device manufacturer (minimum are 3).

### Google Home
Minimum Version Required for Google Home App：2.62.1.15 or later.

Also for Google you need to have a Hub device out of the [list of supported devices](https://support.google.com/googlenest/answer/12391458?hl=en) 
to control your Matter devices.

Pairing is currently only possible using the Google Home Android App on Android 8.1 or higher. The iOS App is not supporting Matter yet.

Before you can pair node-matter to Google Home you need to allow uncertified devices for your Google Account. For this open the [Google 
Developer Console to add an Integration](https://console.home.google.com/projects/matter-test-0db58/matter) and [setup](https://developers.home.google.com/matter/get-started?hl=en&%3Bauthuser=0&authuser=0) the device there. Please use 0xFFF1 as Vendor ID 
because node-matter uses this by the current scripts.
If you do this that pairing will not be possible!
If you have issues with pairing please refer to the [Troubleshootling pages](https://developers.home.google.com/matter/build/troubleshooting?hl=en#verify_your_google_play_services_gps_matter_modules) from Google.

Google supports several [Matter device types](https://developers.home.google.com/matter/supported-devices?authuser=0&hl=en) already.

### Amazon Alexa
Minimum Version Required for Alexa App：2.2.491118.0 or later.

**Please note that because Alexa’s temporarily limited setting, Alexa ecosystem needs to be paired with Matter-certified device as the first ecosystem. If you are unsure, please factory default your device before setup.**

For Amazon Alexa Usage you also need one [Alexa device as Matter hub](https://www.amazon.com/b?ie=UTF8&node=37490568011) in your local network.

Pairing is currently only possible using the Alexa Android App on Android 8.1 or higher. The iOS App is not supporting Matter yet.

For Alexa no special setup is needed to pair node-matter as development device.

The [list of supported device types](https://developer.amazon.com/en-US/docs/alexa/smarthome/matter-support.html#device-categories-and-clusters) 
is basic currently, but will get enhanced in the future.

### Smartthings
Samsung is building its SmartThings hub software into 2022 Samsung Smart TVs, Smart Monitors, and Family Hub refrigerators, allowing them to 
control Matter smart home devices. These are needed as Hubs.

Rest information and not yet known.

### chip-tool

Compile chip-tool from [project-chip](https://github.com/project-chip/connectedhomeip/tree/c438b8945e26a84f68ba3608de202e4b939a9080/examples/chip-tool)

**Provisioning the device**:

```
chip-tool pairing onnetwork 222 20202021
```

**Controlling the device**: 

```
chip-tool onoff toggle 222 1
```

**Clearing the data**:

```
chip-tool pairing unpair 222
and/or
chip-tool storage clear-all
```

### Android mobile app

You can also control it with Matter test app: https://github.com/project-chip/connectedhomeip/tree/master/src/android/CHIPTest
You can find a compiled apk in /matter-test-apk in this repository.

**Provisioning the device**: click "provision with WiFi" > "Input Device address" > type IP address of the machine running node-matter

**Controlling the device**: click "Light on/of" and you can control the light

## FAQ

### Why using node-matter instead of the official codebase?

Well, the original codebase is platform dependent, has finicky tool version requirements and is over 8GB with all dependencies.
This tool is less than 500kB and works on anything supporting node. Sure, it supports only the barebone Matter protocol for now.

### Can this work from a browser?

Not yet, but I know how to make it works with a few tricks.

### How can I have support for more clusters?

Adding more clusters should be pretty easy now the core protocol is working.
Have a look at the implementation of the OnOff cluster: pretty simple, right?

I am planning on adding more clusters, so stay tuned or pinged me to implement first the one you need.

### Contact the developers

For other questions, you can post a message on the github forum, open an issue, or join Discord https://discord.gg/ujmRNrhDuW .

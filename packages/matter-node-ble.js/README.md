# matter-node-ble.js

[![license](https://img.shields.io/badge/license-Apache2-green.svg?style=flat)](https://raw.githubusercontent.com/mfucci/node-matter/master/LICENSE) 

Matter BLE support using bleno for Peripheral/Device side and noble (not implemented yet) for Central/Controller side.

> This package requires Node 16+

This package implements all needed Interfaces and classes to enable BLE Support for matter.js. It implements a class BluetoothNode which can be used as singleton Ble instance.

## Prerquisites and Limitations

The used packages have some limitations and prerequisites. Please check the Readme's of the packages for more details:
* [bleno](https://github.com/abandonware/bleno#readme)
  * For Linux: also consider https://github.com/abandonware/bleno#running-on-linux
  * Bleno is currently not working on macOS because it can not announce the proper data because of macOS limitations!
* [noble](https://github.com/abandonware/noble#readme)
  * Consider Noble prerequisites for your platform: https://github.com/abandonware/noble#prerequisites
  * For Linux: https://github.com/abandonware/noble#running-without-rootsudo-linux-specific
  * When using Device and Controller in parallel: https://github.com/abandonware/noble#bleno-compatibility-linux-specific (NOBLE_MULTI_ROLE might be needed to set)
  * Please also see common issues and solutions: https://github.com/abandonware/noble#common-problems

## Environment Variables used for customization
* Linux: Set the HCI interface for Bleno/Device if multiple are existing: BLENO_HCI_DEVICE_ID=x (default 1) - this is only used for Peripheral/Device side
* Linux: Set the HCI interface for Noble/Controller if multiple are existing: NOBLE_HCI_DEVICE_ID=x (default 0) - this is only used for Central/Controller side

## Building

* `npm run build`: Build all code and create CommonJS and ES6 variants in dist directory. This will built incrementally and only build the changed files.
* `npm run build-clean`: Clean the dist directory and build all code from scratch

## Testing

* `npm run test`: Run all tests - TBD

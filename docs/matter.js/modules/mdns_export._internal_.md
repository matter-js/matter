[@project-chip/matter.js](../README.md) / [Modules](../modules.md) / [mdns/export](mdns_export.md) / \<internal\>

# Module: \<internal\>

## Table of contents

### Type Aliases

- [CommissionableDeviceRecordWithExpire](mdns_export._internal_.md#commissionabledevicerecordwithexpire)
- [MatterServerRecordWithExpire](mdns_export._internal_.md#matterserverrecordwithexpire)
- [OperationalDeviceRecordWithExpire](mdns_export._internal_.md#operationaldevicerecordwithexpire)

## Type Aliases

### CommissionableDeviceRecordWithExpire

Ƭ **CommissionableDeviceRecordWithExpire**: `Omit`\<[`CommissionableDevice`](common_export.md#commissionabledevice), ``"addresses"``\> & \{ `P?`: `number` ; `SD`: `number` ; `V?`: `number` ; `addresses`: `Map`\<`string`, [`MatterServerRecordWithExpire`](mdns_export._internal_.md#matterserverrecordwithexpire)\> ; `expires`: `number` ; `instanceId`: `string`  }

#### Defined in

[packages/matter.js/src/mdns/MdnsScanner.ts:57](https://github.com/project-chip/matter.js/blob/6d3b6a5d957d88a9231d6ecab4bb41f8133112be/packages/matter.js/src/mdns/MdnsScanner.ts#L57)

___

### MatterServerRecordWithExpire

Ƭ **MatterServerRecordWithExpire**: [`ServerAddressIp`](common_export.md#serveraddressip) & \{ `expires`: `number`  }

#### Defined in

[packages/matter.js/src/mdns/MdnsScanner.ts:53](https://github.com/project-chip/matter.js/blob/6d3b6a5d957d88a9231d6ecab4bb41f8133112be/packages/matter.js/src/mdns/MdnsScanner.ts#L53)

___

### OperationalDeviceRecordWithExpire

Ƭ **OperationalDeviceRecordWithExpire**: `Omit`\<[`OperationalDevice`](common_export.md#operationaldevice), ``"addresses"``\> & \{ `addresses`: `Map`\<`string`, [`MatterServerRecordWithExpire`](mdns_export._internal_.md#matterserverrecordwithexpire)\> ; `expires`: `number`  }

#### Defined in

[packages/matter.js/src/mdns/MdnsScanner.ts:66](https://github.com/project-chip/matter.js/blob/6d3b6a5d957d88a9231d6ecab4bb41f8133112be/packages/matter.js/src/mdns/MdnsScanner.ts#L66)

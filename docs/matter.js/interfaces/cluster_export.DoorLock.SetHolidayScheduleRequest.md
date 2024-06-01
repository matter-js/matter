[@project-chip/matter.js](../README.md) / [Modules](../modules.md) / [cluster/export](../modules/cluster_export.md) / [DoorLock](../modules/cluster_export.DoorLock.md) / SetHolidayScheduleRequest

# Interface: SetHolidayScheduleRequest

[cluster/export](../modules/cluster_export.md).[DoorLock](../modules/cluster_export.DoorLock.md).SetHolidayScheduleRequest

Input to the DoorLock setHolidaySchedule command

**`See`**

MatterSpecification.v11.Cluster § 5.2.4

## Hierarchy

- [`TypeFromSchema`](../modules/tlv_export.md#typefromschema)\<typeof [`TlvSetHolidayScheduleRequest`](../modules/cluster_export.DoorLock.md#tlvsetholidayschedulerequest)\>

  ↳ **`SetHolidayScheduleRequest`**

## Table of contents

### Properties

- [holidayIndex](cluster_export.DoorLock.SetHolidayScheduleRequest.md#holidayindex)
- [localEndTime](cluster_export.DoorLock.SetHolidayScheduleRequest.md#localendtime)
- [localStartTime](cluster_export.DoorLock.SetHolidayScheduleRequest.md#localstarttime)
- [operatingMode](cluster_export.DoorLock.SetHolidayScheduleRequest.md#operatingmode)

## Properties

### holidayIndex

• **holidayIndex**: `number`

#### Inherited from

TypeFromSchema.holidayIndex

#### Defined in

[packages/matter.js/src/cluster/definitions/DoorLockCluster.ts:822](https://github.com/project-chip/matter.js/blob/5f71eedebdb9fa54338bde320c311bb359b7455d/packages/matter.js/src/cluster/definitions/DoorLockCluster.ts#L822)

___

### localEndTime

• **localEndTime**: `number`

#### Inherited from

TypeFromSchema.localEndTime

#### Defined in

[packages/matter.js/src/cluster/definitions/DoorLockCluster.ts:824](https://github.com/project-chip/matter.js/blob/5f71eedebdb9fa54338bde320c311bb359b7455d/packages/matter.js/src/cluster/definitions/DoorLockCluster.ts#L824)

___

### localStartTime

• **localStartTime**: `number`

#### Inherited from

TypeFromSchema.localStartTime

#### Defined in

[packages/matter.js/src/cluster/definitions/DoorLockCluster.ts:823](https://github.com/project-chip/matter.js/blob/5f71eedebdb9fa54338bde320c311bb359b7455d/packages/matter.js/src/cluster/definitions/DoorLockCluster.ts#L823)

___

### operatingMode

• **operatingMode**: [`OperatingMode`](../enums/cluster_export.DoorLock.OperatingMode.md)

#### Inherited from

TypeFromSchema.operatingMode

#### Defined in

[packages/matter.js/src/cluster/definitions/DoorLockCluster.ts:825](https://github.com/project-chip/matter.js/blob/5f71eedebdb9fa54338bde320c311bb359b7455d/packages/matter.js/src/cluster/definitions/DoorLockCluster.ts#L825)

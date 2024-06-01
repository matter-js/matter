[@project-chip/matter.js](../README.md) / [Modules](../modules.md) / [cluster/export](../modules/cluster_export.md) / [DoorLock](../modules/cluster_export.DoorLock.md) / UnlockWithTimeoutRequest

# Interface: UnlockWithTimeoutRequest

[cluster/export](../modules/cluster_export.md).[DoorLock](../modules/cluster_export.DoorLock.md).UnlockWithTimeoutRequest

Input to the DoorLock unlockWithTimeout command

**`See`**

MatterSpecification.v11.Cluster § 5.2.4

## Hierarchy

- [`TypeFromSchema`](../modules/tlv_export.md#typefromschema)\<typeof [`TlvUnlockWithTimeoutRequest`](../modules/cluster_export.DoorLock.md#tlvunlockwithtimeoutrequest)\>

  ↳ **`UnlockWithTimeoutRequest`**

## Table of contents

### Properties

- [pinCode](cluster_export.DoorLock.UnlockWithTimeoutRequest.md#pincode)
- [timeout](cluster_export.DoorLock.UnlockWithTimeoutRequest.md#timeout)

## Properties

### pinCode

• `Optional` **pinCode**: `Uint8Array`

#### Inherited from

TypeFromSchema.pinCode

#### Defined in

[packages/matter.js/src/cluster/definitions/DoorLockCluster.ts:1151](https://github.com/project-chip/matter.js/blob/5f71eedebdb9fa54338bde320c311bb359b7455d/packages/matter.js/src/cluster/definitions/DoorLockCluster.ts#L1151)

___

### timeout

• **timeout**: `number`

#### Inherited from

TypeFromSchema.timeout

#### Defined in

[packages/matter.js/src/cluster/definitions/DoorLockCluster.ts:1150](https://github.com/project-chip/matter.js/blob/5f71eedebdb9fa54338bde320c311bb359b7455d/packages/matter.js/src/cluster/definitions/DoorLockCluster.ts#L1150)

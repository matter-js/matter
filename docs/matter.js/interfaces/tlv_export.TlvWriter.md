[@project-chip/matter.js](../README.md) / [Modules](../modules.md) / [tlv/export](../modules/tlv_export.md) / TlvWriter

# Interface: TlvWriter

[tlv/export](../modules/tlv_export.md).TlvWriter

## Implemented by

- [`TlvArrayWriter`](../classes/tlv_export.TlvArrayWriter.md)
- [`TlvByteArrayWriter`](../classes/tlv_export.TlvByteArrayWriter.md)

## Table of contents

### Methods

- [writePrimitive](tlv_export.TlvWriter.md#writeprimitive)
- [writeTag](tlv_export.TlvWriter.md#writetag)

## Methods

### writePrimitive

▸ **writePrimitive**\<`T`\>(`typeLength`, `value`): `void`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends [`TlvTypeLength`](../modules/tlv_export.md#tlvtypelength) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `typeLength` | `T` |
| `value` | [`TlvToPrimitive`](../modules/tlv_export.md#tlvtoprimitive)[`T`[``"type"``]] |

#### Returns

`void`

#### Defined in

[packages/matter.js/src/tlv/TlvSchema.ts:103](https://github.com/project-chip/matter.js/blob/6d3b6a5d957d88a9231d6ecab4bb41f8133112be/packages/matter.js/src/tlv/TlvSchema.ts#L103)

___

### writeTag

▸ **writeTag**(`typeLength`, `tag?`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `typeLength` | [`TlvTypeLength`](../modules/tlv_export.md#tlvtypelength) |
| `tag?` | [`TlvTag`](../modules/tlv_export.md#tlvtag) |

#### Returns

`void`

#### Defined in

[packages/matter.js/src/tlv/TlvSchema.ts:101](https://github.com/project-chip/matter.js/blob/6d3b6a5d957d88a9231d6ecab4bb41f8133112be/packages/matter.js/src/tlv/TlvSchema.ts#L101)

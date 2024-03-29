[@project-chip/matter.js](../README.md) / [Modules](../modules.md) / [cluster/export](../modules/cluster_export.md) / [ColorControl](../modules/cluster_export.ColorControl.md) / MoveToColorRequest

# Interface: MoveToColorRequest

[cluster/export](../modules/cluster_export.md).[ColorControl](../modules/cluster_export.ColorControl.md).MoveToColorRequest

Input to the ColorControl moveToColor command

**`See`**

[MatterApplicationClusterSpecificationV1_1](spec_export.MatterApplicationClusterSpecificationV1_1.md) § 3.2.11.11

## Hierarchy

- [`TypeFromSchema`](../modules/tlv_export.md#typefromschema)\<typeof [`TlvMoveToColorRequest`](../modules/cluster_export.ColorControl.md#tlvmovetocolorrequest)\>

  ↳ **`MoveToColorRequest`**

## Table of contents

### Properties

- [colorX](cluster_export.ColorControl.MoveToColorRequest.md#colorx)
- [colorY](cluster_export.ColorControl.MoveToColorRequest.md#colory)
- [optionsMask](cluster_export.ColorControl.MoveToColorRequest.md#optionsmask)
- [optionsOverride](cluster_export.ColorControl.MoveToColorRequest.md#optionsoverride)
- [transitionTime](cluster_export.ColorControl.MoveToColorRequest.md#transitiontime)

## Properties

### colorX

• **colorX**: `number`

#### Inherited from

TypeFromSchema.colorX

#### Defined in

[packages/matter.js/src/cluster/definitions/ColorControlCluster.ts:307](https://github.com/project-chip/matter.js/blob/3adaded6/packages/matter.js/src/cluster/definitions/ColorControlCluster.ts#L307)

___

### colorY

• **colorY**: `number`

#### Inherited from

TypeFromSchema.colorY

#### Defined in

[packages/matter.js/src/cluster/definitions/ColorControlCluster.ts:308](https://github.com/project-chip/matter.js/blob/3adaded6/packages/matter.js/src/cluster/definitions/ColorControlCluster.ts#L308)

___

### optionsMask

• **optionsMask**: [`TypeFromPartialBitSchema`](../modules/schema_export.md#typefrompartialbitschema)\<\{ `executeIfOff`: [`BitFlag`](../modules/schema_export.md#bitflag)  }\>

#### Inherited from

TypeFromSchema.optionsMask

#### Defined in

[packages/matter.js/src/cluster/definitions/ColorControlCluster.ts:310](https://github.com/project-chip/matter.js/blob/3adaded6/packages/matter.js/src/cluster/definitions/ColorControlCluster.ts#L310)

___

### optionsOverride

• **optionsOverride**: [`TypeFromPartialBitSchema`](../modules/schema_export.md#typefrompartialbitschema)\<\{ `executeIfOff`: [`BitFlag`](../modules/schema_export.md#bitflag)  }\>

#### Inherited from

TypeFromSchema.optionsOverride

#### Defined in

[packages/matter.js/src/cluster/definitions/ColorControlCluster.ts:311](https://github.com/project-chip/matter.js/blob/3adaded6/packages/matter.js/src/cluster/definitions/ColorControlCluster.ts#L311)

___

### transitionTime

• **transitionTime**: `number`

#### Inherited from

TypeFromSchema.transitionTime

#### Defined in

[packages/matter.js/src/cluster/definitions/ColorControlCluster.ts:309](https://github.com/project-chip/matter.js/blob/3adaded6/packages/matter.js/src/cluster/definitions/ColorControlCluster.ts#L309)

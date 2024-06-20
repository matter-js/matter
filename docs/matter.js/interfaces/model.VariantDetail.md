[@project-chip/matter.js](../README.md) / [Modules](../modules.md) / [model](../modules/model.md) / VariantDetail

# Interface: VariantDetail

[model](../modules/model.md).VariantDetail

Supplies operational information about a set of variants.

## Table of contents

### Properties

- [id](model.VariantDetail.md#id)
- [map](model.VariantDetail.md#map)
- [name](model.VariantDetail.md#name)
- [tag](model.VariantDetail.md#tag)

## Properties

### id

• `Optional` **id**: `number`

The highest priority ID across all variants, if any variant has an ID.

#### Defined in

[packages/matter.js/src/model/logic/ModelVariantTraversal.ts:39](https://github.com/project-chip/matter.js/blob/6d3b6a5d957d88a9231d6ecab4bb41f8133112be/packages/matter.js/src/model/logic/ModelVariantTraversal.ts#L39)

___

### map

• **map**: [`VariantMap`](../modules/model.md#variantmap)

The actual variants.

#### Defined in

[packages/matter.js/src/model/logic/ModelVariantTraversal.ts:49](https://github.com/project-chip/matter.js/blob/6d3b6a5d957d88a9231d6ecab4bb41f8133112be/packages/matter.js/src/model/logic/ModelVariantTraversal.ts#L49)

___

### name

• **name**: `string`

The canonical name to use for the variants.

#### Defined in

[packages/matter.js/src/model/logic/ModelVariantTraversal.ts:44](https://github.com/project-chip/matter.js/blob/6d3b6a5d957d88a9231d6ecab4bb41f8133112be/packages/matter.js/src/model/logic/ModelVariantTraversal.ts#L44)

___

### tag

• **tag**: [`ElementTag`](../enums/model.ElementTag.md)

The shared tag across all variants.

#### Defined in

[packages/matter.js/src/model/logic/ModelVariantTraversal.ts:34](https://github.com/project-chip/matter.js/blob/6d3b6a5d957d88a9231d6ecab4bb41f8133112be/packages/matter.js/src/model/logic/ModelVariantTraversal.ts#L34)

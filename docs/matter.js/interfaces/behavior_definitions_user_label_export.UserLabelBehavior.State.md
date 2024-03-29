[@project-chip/matter.js](../README.md) / [Modules](../modules.md) / [behavior/definitions/user-label/export](../modules/behavior_definitions_user_label_export.md) / [UserLabelBehavior](../modules/behavior_definitions_user_label_export.UserLabelBehavior.md) / State

# Interface: State

[behavior/definitions/user-label/export](../modules/behavior_definitions_user_label_export.md).[UserLabelBehavior](../modules/behavior_definitions_user_label_export.UserLabelBehavior.md).State

## Hierarchy

- [`StateType`](../modules/behavior_definitions_user_label_export._internal_.md#statetype)

  ↳ **`State`**

## Table of contents

### Properties

- [labelList](behavior_definitions_user_label_export.UserLabelBehavior.State.md#labellist)

## Properties

### labelList

• **labelList**: [`TypeFromFields`](../modules/tlv_export.md#typefromfields)\<\{ `label`: [`FieldType`](tlv_export.FieldType.md)\<`string`\> ; `value`: [`FieldType`](tlv_export.FieldType.md)\<`string`\>  }\>[]

An implementation shall support at least 4 list entries per node for all User Label cluster instances on
the node.

**`See`**

[MatterCoreSpecificationV1_1](spec_export.MatterCoreSpecificationV1_1.md) § 9.9.4.1

#### Inherited from

StateType.labelList

#### Defined in

[packages/matter.js/src/cluster/definitions/UserLabelCluster.ts:33](https://github.com/project-chip/matter.js/blob/3adaded6/packages/matter.js/src/cluster/definitions/UserLabelCluster.ts#L33)

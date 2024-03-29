[@project-chip/matter.js](../README.md) / [Modules](../modules.md) / [cluster/export](../modules/cluster_export.md) / [Scenes](../modules/cluster_export.Scenes.md) / RecallSceneRequest

# Interface: RecallSceneRequest

[cluster/export](../modules/cluster_export.md).[Scenes](../modules/cluster_export.Scenes.md).RecallSceneRequest

Input to the Scenes recallScene command

**`See`**

[MatterApplicationClusterSpecificationV1_1](spec_export.MatterApplicationClusterSpecificationV1_1.md) § 1.4.9.7

## Hierarchy

- [`TypeFromSchema`](../modules/tlv_export.md#typefromschema)\<typeof [`TlvRecallSceneRequest`](../modules/cluster_export.Scenes.md#tlvrecallscenerequest)\>

  ↳ **`RecallSceneRequest`**

## Table of contents

### Properties

- [groupId](cluster_export.Scenes.RecallSceneRequest.md#groupid)
- [sceneId](cluster_export.Scenes.RecallSceneRequest.md#sceneid)
- [transitionTime](cluster_export.Scenes.RecallSceneRequest.md#transitiontime)

## Properties

### groupId

• **groupId**: [`GroupId`](../modules/datatype_export.md#groupid)

#### Inherited from

TypeFromSchema.groupId

#### Defined in

[packages/matter.js/src/cluster/definitions/ScenesCluster.ts:259](https://github.com/project-chip/matter.js/blob/3adaded6/packages/matter.js/src/cluster/definitions/ScenesCluster.ts#L259)

___

### sceneId

• **sceneId**: `number`

#### Inherited from

TypeFromSchema.sceneId

#### Defined in

[packages/matter.js/src/cluster/definitions/ScenesCluster.ts:260](https://github.com/project-chip/matter.js/blob/3adaded6/packages/matter.js/src/cluster/definitions/ScenesCluster.ts#L260)

___

### transitionTime

• `Optional` **transitionTime**: ``null`` \| `number`

#### Inherited from

TypeFromSchema.transitionTime

#### Defined in

[packages/matter.js/src/cluster/definitions/ScenesCluster.ts:261](https://github.com/project-chip/matter.js/blob/3adaded6/packages/matter.js/src/cluster/definitions/ScenesCluster.ts#L261)

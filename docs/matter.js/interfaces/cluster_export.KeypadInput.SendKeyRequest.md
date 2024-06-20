[@project-chip/matter.js](../README.md) / [Modules](../modules.md) / [cluster/export](../modules/cluster_export.md) / [KeypadInput](../modules/cluster_export.KeypadInput.md) / SendKeyRequest

# Interface: SendKeyRequest

[cluster/export](../modules/cluster_export.md).[KeypadInput](../modules/cluster_export.KeypadInput.md).SendKeyRequest

Input to the KeypadInput sendKey command

**`See`**

MatterSpecification.v11.Cluster § 6.8.3.1

## Hierarchy

- [`TypeFromSchema`](../modules/tlv_export.md#typefromschema)\<typeof [`TlvSendKeyRequest`](../modules/cluster_export.KeypadInput.md#tlvsendkeyrequest)\>

  ↳ **`SendKeyRequest`**

## Table of contents

### Properties

- [keyCode](cluster_export.KeypadInput.SendKeyRequest.md#keycode)

## Properties

### keyCode

• **keyCode**: [`CecKeyCode`](../enums/cluster_export.KeypadInput.CecKeyCode.md)

This shall indicate the key code to process.

**`See`**

MatterSpecification.v11.Cluster § 6.8.3.1.1

#### Inherited from

TypeFromSchema.keyCode

#### Defined in

[packages/matter.js/src/cluster/definitions/KeypadInputCluster.ts:119](https://github.com/project-chip/matter.js/blob/6d3b6a5d957d88a9231d6ecab4bb41f8133112be/packages/matter.js/src/cluster/definitions/KeypadInputCluster.ts#L119)

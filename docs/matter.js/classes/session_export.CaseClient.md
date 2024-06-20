[@project-chip/matter.js](../README.md) / [Modules](../modules.md) / [session/export](../modules/session_export.md) / CaseClient

# Class: CaseClient

[session/export](../modules/session_export.md).CaseClient

## Table of contents

### Constructors

- [constructor](session_export.CaseClient.md#constructor)

### Methods

- [pair](session_export.CaseClient.md#pair)

## Constructors

### constructor

• **new CaseClient**(): [`CaseClient`](session_export.CaseClient.md)

#### Returns

[`CaseClient`](session_export.CaseClient.md)

## Methods

### pair

▸ **pair**(`client`, `exchange`, `fabric`, `peerNodeId`): `Promise`\<[`SecureSession`](session_export.SecureSession.md)\<[`MatterController`](export._internal_.MatterController.md)\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `client` | [`MatterController`](export._internal_.MatterController.md) |
| `exchange` | [`MessageExchange`](protocol_export.MessageExchange.md)\<[`MatterController`](export._internal_.MatterController.md)\> |
| `fabric` | [`Fabric`](fabric_export.Fabric.md) |
| `peerNodeId` | [`NodeId`](../modules/datatype_export.md#nodeid) |

#### Returns

`Promise`\<[`SecureSession`](session_export.SecureSession.md)\<[`MatterController`](export._internal_.MatterController.md)\>\>

#### Defined in

[packages/matter.js/src/session/case/CaseClient.ts:35](https://github.com/project-chip/matter.js/blob/6d3b6a5d957d88a9231d6ecab4bb41f8133112be/packages/matter.js/src/session/case/CaseClient.ts#L35)

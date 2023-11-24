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

• **new CaseClient**()

## Methods

### pair

▸ **pair**(`client`, `exchange`, `fabric`, `peerNodeId`): `Promise`<[`SecureSession`](session_export.SecureSession.md)<[`MatterController`](export._internal_.MatterController.md)\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `client` | [`MatterController`](export._internal_.MatterController.md) |
| `exchange` | [`MessageExchange`](protocol_export.MessageExchange.md)<[`MatterController`](export._internal_.MatterController.md)\> |
| `fabric` | [`Fabric`](fabric_export.Fabric.md) |
| `peerNodeId` | [`NodeId`](../modules/datatype_export.md#nodeid) |

#### Returns

`Promise`<[`SecureSession`](session_export.SecureSession.md)<[`MatterController`](export._internal_.MatterController.md)\>\>

#### Defined in

[packages/matter.js/src/session/case/CaseClient.ts:35](https://github.com/project-chip/matter.js/blob/ac2c2688/packages/matter.js/src/session/case/CaseClient.ts#L35)

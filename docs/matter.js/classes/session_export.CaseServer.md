[@project-chip/matter.js](../README.md) / [Modules](../modules.md) / [session/export](../modules/session_export.md) / CaseServer

# Class: CaseServer

[session/export](../modules/session_export.md).CaseServer

## Implements

- [`ProtocolHandler`](../interfaces/protocol_export.ProtocolHandler.md)\<[`MatterDevice`](behavior_cluster_export._internal_.MatterDevice.md)\>

## Table of contents

### Constructors

- [constructor](session_export.CaseServer.md#constructor)

### Methods

- [close](session_export.CaseServer.md#close)
- [getId](session_export.CaseServer.md#getid)
- [handleSigma1](session_export.CaseServer.md#handlesigma1)
- [onNewExchange](session_export.CaseServer.md#onnewexchange)

## Constructors

### constructor

• **new CaseServer**(): [`CaseServer`](session_export.CaseServer.md)

#### Returns

[`CaseServer`](session_export.CaseServer.md)

## Methods

### close

▸ **close**(): `Promise`\<`void`\>

#### Returns

`Promise`\<`void`\>

#### Implementation of

[ProtocolHandler](../interfaces/protocol_export.ProtocolHandler.md).[close](../interfaces/protocol_export.ProtocolHandler.md#close)

#### Defined in

[packages/matter.js/src/session/case/CaseServer.ts:256](https://github.com/project-chip/matter.js/blob/6d3b6a5d957d88a9231d6ecab4bb41f8133112be/packages/matter.js/src/session/case/CaseServer.ts#L256)

___

### getId

▸ **getId**(): `number`

#### Returns

`number`

#### Implementation of

[ProtocolHandler](../interfaces/protocol_export.ProtocolHandler.md).[getId](../interfaces/protocol_export.ProtocolHandler.md#getid)

#### Defined in

[packages/matter.js/src/session/case/CaseServer.ts:58](https://github.com/project-chip/matter.js/blob/6d3b6a5d957d88a9231d6ecab4bb41f8133112be/packages/matter.js/src/session/case/CaseServer.ts#L58)

___

### handleSigma1

▸ **handleSigma1**(`server`, `messenger`): `Promise`\<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `server` | [`MatterDevice`](behavior_cluster_export._internal_.MatterDevice.md) |
| `messenger` | [`CaseServerMessenger`](session_export.CaseServerMessenger.md) |

#### Returns

`Promise`\<`void`\>

#### Defined in

[packages/matter.js/src/session/case/CaseServer.ts:62](https://github.com/project-chip/matter.js/blob/6d3b6a5d957d88a9231d6ecab4bb41f8133112be/packages/matter.js/src/session/case/CaseServer.ts#L62)

___

### onNewExchange

▸ **onNewExchange**(`exchange`): `Promise`\<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `exchange` | [`MessageExchange`](protocol_export.MessageExchange.md)\<[`MatterDevice`](behavior_cluster_export._internal_.MatterDevice.md)\> |

#### Returns

`Promise`\<`void`\>

#### Implementation of

[ProtocolHandler](../interfaces/protocol_export.ProtocolHandler.md).[onNewExchange](../interfaces/protocol_export.ProtocolHandler.md#onnewexchange)

#### Defined in

[packages/matter.js/src/session/case/CaseServer.ts:38](https://github.com/project-chip/matter.js/blob/6d3b6a5d957d88a9231d6ecab4bb41f8133112be/packages/matter.js/src/session/case/CaseServer.ts#L38)

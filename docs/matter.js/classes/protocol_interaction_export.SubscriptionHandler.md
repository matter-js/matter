[@project-chip/matter.js](../README.md) / [Modules](../modules.md) / [protocol/interaction/export](../modules/protocol_interaction_export.md) / SubscriptionHandler

# Class: SubscriptionHandler

[protocol/interaction/export](../modules/protocol_interaction_export.md).SubscriptionHandler

## Table of contents

### Constructors

- [constructor](protocol_interaction_export.SubscriptionHandler.md#constructor)

### Properties

- [attributeListeners](protocol_interaction_export.SubscriptionHandler.md#attributelisteners)
- [attributeRequests](protocol_interaction_export.SubscriptionHandler.md#attributerequests)
- [cancelCallback](protocol_interaction_export.SubscriptionHandler.md#cancelcallback)
- [dataVersionFilters](protocol_interaction_export.SubscriptionHandler.md#dataversionfilters)
- [endpointStructure](protocol_interaction_export.SubscriptionHandler.md#endpointstructure)
- [eventFilters](protocol_interaction_export.SubscriptionHandler.md#eventfilters)
- [eventHandler](protocol_interaction_export.SubscriptionHandler.md#eventhandler)
- [eventListeners](protocol_interaction_export.SubscriptionHandler.md#eventlisteners)
- [eventRequests](protocol_interaction_export.SubscriptionHandler.md#eventrequests)
- [fabric](protocol_interaction_export.SubscriptionHandler.md#fabric)
- [isFabricFiltered](protocol_interaction_export.SubscriptionHandler.md#isfabricfiltered)
- [lastUpdateTimeMs](protocol_interaction_export.SubscriptionHandler.md#lastupdatetimems)
- [maxInterval](protocol_interaction_export.SubscriptionHandler.md#maxinterval)
- [maxIntervalCeilingMs](protocol_interaction_export.SubscriptionHandler.md#maxintervalceilingms)
- [minIntervalFloorMs](protocol_interaction_export.SubscriptionHandler.md#minintervalfloorms)
- [outstandingAttributeUpdates](protocol_interaction_export.SubscriptionHandler.md#outstandingattributeupdates)
- [outstandingEventUpdates](protocol_interaction_export.SubscriptionHandler.md#outstandingeventupdates)
- [peerNodeId](protocol_interaction_export.SubscriptionHandler.md#peernodeid)
- [sendDelayTimer](protocol_interaction_export.SubscriptionHandler.md#senddelaytimer)
- [sendInterval](protocol_interaction_export.SubscriptionHandler.md#sendinterval)
- [sendNextUpdateImmediately](protocol_interaction_export.SubscriptionHandler.md#sendnextupdateimmediately)
- [sendUpdateErrorCounter](protocol_interaction_export.SubscriptionHandler.md#sendupdateerrorcounter)
- [sendUpdatesActivated](protocol_interaction_export.SubscriptionHandler.md#sendupdatesactivated)
- [sendingUpdateInProgress](protocol_interaction_export.SubscriptionHandler.md#sendingupdateinprogress)
- [server](protocol_interaction_export.SubscriptionHandler.md#server)
- [session](protocol_interaction_export.SubscriptionHandler.md#session)
- [subscriptionId](protocol_interaction_export.SubscriptionHandler.md#subscriptionid)
- [updateTimer](protocol_interaction_export.SubscriptionHandler.md#updatetimer)

### Methods

- [activateSendingUpdates](protocol_interaction_export.SubscriptionHandler.md#activatesendingupdates)
- [attributeChangeListener](protocol_interaction_export.SubscriptionHandler.md#attributechangelistener)
- [cancel](protocol_interaction_export.SubscriptionHandler.md#cancel)
- [determineSendingIntervals](protocol_interaction_export.SubscriptionHandler.md#determinesendingintervals)
- [eventChangeListener](protocol_interaction_export.SubscriptionHandler.md#eventchangelistener)
- [flush](protocol_interaction_export.SubscriptionHandler.md#flush)
- [getMaxInterval](protocol_interaction_export.SubscriptionHandler.md#getmaxinterval)
- [getSendInterval](protocol_interaction_export.SubscriptionHandler.md#getsendinterval)
- [prepareDataUpdate](protocol_interaction_export.SubscriptionHandler.md#preparedataupdate)
- [registerNewAttributes](protocol_interaction_export.SubscriptionHandler.md#registernewattributes)
- [registerNewEvents](protocol_interaction_export.SubscriptionHandler.md#registernewevents)
- [sendInitialReport](protocol_interaction_export.SubscriptionHandler.md#sendinitialreport)
- [sendUpdate](protocol_interaction_export.SubscriptionHandler.md#sendupdate)
- [sendUpdateMessage](protocol_interaction_export.SubscriptionHandler.md#sendupdatemessage)
- [unregisterAttributeListeners](protocol_interaction_export.SubscriptionHandler.md#unregisterattributelisteners)
- [unregisterEventListeners](protocol_interaction_export.SubscriptionHandler.md#unregistereventlisteners)
- [updateSubscription](protocol_interaction_export.SubscriptionHandler.md#updatesubscription)

## Constructors

### constructor

• **new SubscriptionHandler**(`subscriptionId`, `session`, `endpointStructure`, `attributeRequests`, `dataVersionFilters`, `eventRequests`, `eventFilters`, `eventHandler`, `isFabricFiltered`, `minIntervalFloor`, `maxIntervalCeiling`, `cancelCallback`, `subscriptionOptions`): [`SubscriptionHandler`](protocol_interaction_export.SubscriptionHandler.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `subscriptionId` | `number` |
| `session` | [`SecureSession`](session_export.SecureSession.md)\<`any`\> |
| `endpointStructure` | [`InteractionEndpointStructure`](protocol_interaction_export.InteractionEndpointStructure.md) |
| `attributeRequests` | `undefined` \| [`TypeFromFields`](../modules/tlv_export.md#typefromfields)\<\{ `attributeId`: [`OptionalFieldType`](../interfaces/tlv_export.OptionalFieldType.md)\<[`AttributeId`](../modules/datatype_export.md#attributeid)\> ; `clusterId`: [`OptionalFieldType`](../interfaces/tlv_export.OptionalFieldType.md)\<[`ClusterId`](../modules/datatype_export.md#clusterid)\> ; `enableTagCompression`: [`OptionalFieldType`](../interfaces/tlv_export.OptionalFieldType.md)\<`boolean`\> ; `endpointId`: [`OptionalFieldType`](../interfaces/tlv_export.OptionalFieldType.md)\<[`EndpointNumber`](../modules/datatype_export.md#endpointnumber)\> ; `listIndex`: [`OptionalFieldType`](../interfaces/tlv_export.OptionalFieldType.md)\<``null`` \| `number`\> ; `nodeId`: [`OptionalFieldType`](../interfaces/tlv_export.OptionalFieldType.md)\<[`NodeId`](../modules/datatype_export.md#nodeid)\>  }\>[] |
| `dataVersionFilters` | `undefined` \| [`TypeFromFields`](../modules/tlv_export.md#typefromfields)\<\{ `dataVersion`: [`FieldType`](../interfaces/tlv_export.FieldType.md)\<`number`\> ; `path`: [`FieldType`](../interfaces/tlv_export.FieldType.md)\<[`TypeFromFields`](../modules/tlv_export.md#typefromfields)\<\{ `clusterId`: [`FieldType`](../interfaces/tlv_export.FieldType.md)\<[`ClusterId`](../modules/datatype_export.md#clusterid)\> ; `endpointId`: [`FieldType`](../interfaces/tlv_export.FieldType.md)\<[`EndpointNumber`](../modules/datatype_export.md#endpointnumber)\> ; `nodeId`: [`OptionalFieldType`](../interfaces/tlv_export.OptionalFieldType.md)\<[`NodeId`](../modules/datatype_export.md#nodeid)\>  }\>\>  }\>[] |
| `eventRequests` | `undefined` \| [`TypeFromFields`](../modules/tlv_export.md#typefromfields)\<\{ `clusterId`: [`OptionalFieldType`](../interfaces/tlv_export.OptionalFieldType.md)\<[`ClusterId`](../modules/datatype_export.md#clusterid)\> ; `endpointId`: [`OptionalFieldType`](../interfaces/tlv_export.OptionalFieldType.md)\<[`EndpointNumber`](../modules/datatype_export.md#endpointnumber)\> ; `eventId`: [`OptionalFieldType`](../interfaces/tlv_export.OptionalFieldType.md)\<[`EventId`](../modules/datatype_export.md#eventid)\> ; `isUrgent`: [`OptionalFieldType`](../interfaces/tlv_export.OptionalFieldType.md)\<`boolean`\> ; `nodeId`: [`OptionalFieldType`](../interfaces/tlv_export.OptionalFieldType.md)\<[`NodeId`](../modules/datatype_export.md#nodeid)\>  }\>[] |
| `eventFilters` | `undefined` \| [`TypeFromFields`](../modules/tlv_export.md#typefromfields)\<\{ `eventMin`: [`FieldType`](../interfaces/tlv_export.FieldType.md)\<`number` \| `bigint`\> ; `nodeId`: [`OptionalFieldType`](../interfaces/tlv_export.OptionalFieldType.md)\<[`NodeId`](../modules/datatype_export.md#nodeid)\>  }\>[] |
| `eventHandler` | [`EventHandler`](protocol_interaction_export.EventHandler.md)\<`any`\> |
| `isFabricFiltered` | `boolean` |
| `minIntervalFloor` | `number` |
| `maxIntervalCeiling` | `number` |
| `cancelCallback` | () => `void` |
| `subscriptionOptions` | [`Configuration`](../interfaces/node_export._internal_.SubscriptionOptions.Configuration.md) |

#### Returns

[`SubscriptionHandler`](protocol_interaction_export.SubscriptionHandler.md)

#### Defined in

[packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts:95](https://github.com/project-chip/matter.js/blob/5f71eedebdb9fa54338bde320c311bb359b7455d/packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts#L95)

## Properties

### attributeListeners

• `Private` `Readonly` **attributeListeners**: `Map`\<`string`, \{ `attribute`: [`AnyAttributeServer`](../modules/cluster_export.md#anyattributeserver)\<`any`\> ; `listener?`: (`value`: `any`, `version`: `number`) => `void`  }\>

#### Defined in

[packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts:68](https://github.com/project-chip/matter.js/blob/5f71eedebdb9fa54338bde320c311bb359b7455d/packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts#L68)

___

### attributeRequests

• `Private` `Readonly` **attributeRequests**: `undefined` \| [`TypeFromFields`](../modules/tlv_export.md#typefromfields)\<\{ `attributeId`: [`OptionalFieldType`](../interfaces/tlv_export.OptionalFieldType.md)\<[`AttributeId`](../modules/datatype_export.md#attributeid)\> ; `clusterId`: [`OptionalFieldType`](../interfaces/tlv_export.OptionalFieldType.md)\<[`ClusterId`](../modules/datatype_export.md#clusterid)\> ; `enableTagCompression`: [`OptionalFieldType`](../interfaces/tlv_export.OptionalFieldType.md)\<`boolean`\> ; `endpointId`: [`OptionalFieldType`](../interfaces/tlv_export.OptionalFieldType.md)\<[`EndpointNumber`](../modules/datatype_export.md#endpointnumber)\> ; `listIndex`: [`OptionalFieldType`](../interfaces/tlv_export.OptionalFieldType.md)\<``null`` \| `number`\> ; `nodeId`: [`OptionalFieldType`](../interfaces/tlv_export.OptionalFieldType.md)\<[`NodeId`](../modules/datatype_export.md#nodeid)\>  }\>[]

#### Defined in

[packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts:99](https://github.com/project-chip/matter.js/blob/5f71eedebdb9fa54338bde320c311bb359b7455d/packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts#L99)

___

### cancelCallback

• `Private` `Readonly` **cancelCallback**: () => `void`

#### Type declaration

▸ (): `void`

##### Returns

`void`

#### Defined in

[packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts:107](https://github.com/project-chip/matter.js/blob/5f71eedebdb9fa54338bde320c311bb359b7455d/packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts#L107)

___

### dataVersionFilters

• `Private` `Readonly` **dataVersionFilters**: `undefined` \| [`TypeFromFields`](../modules/tlv_export.md#typefromfields)\<\{ `dataVersion`: [`FieldType`](../interfaces/tlv_export.FieldType.md)\<`number`\> ; `path`: [`FieldType`](../interfaces/tlv_export.FieldType.md)\<[`TypeFromFields`](../modules/tlv_export.md#typefromfields)\<\{ `clusterId`: [`FieldType`](../interfaces/tlv_export.FieldType.md)\<[`ClusterId`](../modules/datatype_export.md#clusterid)\> ; `endpointId`: [`FieldType`](../interfaces/tlv_export.FieldType.md)\<[`EndpointNumber`](../modules/datatype_export.md#endpointnumber)\> ; `nodeId`: [`OptionalFieldType`](../interfaces/tlv_export.OptionalFieldType.md)\<[`NodeId`](../modules/datatype_export.md#nodeid)\>  }\>\>  }\>[]

#### Defined in

[packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts:100](https://github.com/project-chip/matter.js/blob/5f71eedebdb9fa54338bde320c311bb359b7455d/packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts#L100)

___

### endpointStructure

• `Private` `Readonly` **endpointStructure**: [`InteractionEndpointStructure`](protocol_interaction_export.InteractionEndpointStructure.md)

#### Defined in

[packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts:98](https://github.com/project-chip/matter.js/blob/5f71eedebdb9fa54338bde320c311bb359b7455d/packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts#L98)

___

### eventFilters

• `Private` `Readonly` **eventFilters**: `undefined` \| [`TypeFromFields`](../modules/tlv_export.md#typefromfields)\<\{ `eventMin`: [`FieldType`](../interfaces/tlv_export.FieldType.md)\<`number` \| `bigint`\> ; `nodeId`: [`OptionalFieldType`](../interfaces/tlv_export.OptionalFieldType.md)\<[`NodeId`](../modules/datatype_export.md#nodeid)\>  }\>[]

#### Defined in

[packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts:102](https://github.com/project-chip/matter.js/blob/5f71eedebdb9fa54338bde320c311bb359b7455d/packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts#L102)

___

### eventHandler

• `Private` `Readonly` **eventHandler**: [`EventHandler`](protocol_interaction_export.EventHandler.md)\<`any`\>

#### Defined in

[packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts:103](https://github.com/project-chip/matter.js/blob/5f71eedebdb9fa54338bde320c311bb359b7455d/packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts#L103)

___

### eventListeners

• `Private` `Readonly` **eventListeners**: `Map`\<`string`, \{ `event`: [`EventServer`](cluster_export.EventServer.md)\<`any`, `any`\> ; `listener?`: (`newEvent`: [`EventStorageData`](../interfaces/protocol_interaction_export.EventStorageData.md)\<`any`\>) => `void`  }\>

#### Defined in

[packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts:75](https://github.com/project-chip/matter.js/blob/5f71eedebdb9fa54338bde320c311bb359b7455d/packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts#L75)

___

### eventRequests

• `Private` `Readonly` **eventRequests**: `undefined` \| [`TypeFromFields`](../modules/tlv_export.md#typefromfields)\<\{ `clusterId`: [`OptionalFieldType`](../interfaces/tlv_export.OptionalFieldType.md)\<[`ClusterId`](../modules/datatype_export.md#clusterid)\> ; `endpointId`: [`OptionalFieldType`](../interfaces/tlv_export.OptionalFieldType.md)\<[`EndpointNumber`](../modules/datatype_export.md#endpointnumber)\> ; `eventId`: [`OptionalFieldType`](../interfaces/tlv_export.OptionalFieldType.md)\<[`EventId`](../modules/datatype_export.md#eventid)\> ; `isUrgent`: [`OptionalFieldType`](../interfaces/tlv_export.OptionalFieldType.md)\<`boolean`\> ; `nodeId`: [`OptionalFieldType`](../interfaces/tlv_export.OptionalFieldType.md)\<[`NodeId`](../modules/datatype_export.md#nodeid)\>  }\>[]

#### Defined in

[packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts:101](https://github.com/project-chip/matter.js/blob/5f71eedebdb9fa54338bde320c311bb359b7455d/packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts#L101)

___

### fabric

• `Private` `Readonly` **fabric**: [`Fabric`](fabric_export.Fabric.md)

#### Defined in

[packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts:88](https://github.com/project-chip/matter.js/blob/5f71eedebdb9fa54338bde320c311bb359b7455d/packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts#L88)

___

### isFabricFiltered

• `Private` `Readonly` **isFabricFiltered**: `boolean`

#### Defined in

[packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts:104](https://github.com/project-chip/matter.js/blob/5f71eedebdb9fa54338bde320c311bb359b7455d/packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts#L104)

___

### lastUpdateTimeMs

• `Private` **lastUpdateTimeMs**: `number` = `0`

#### Defined in

[packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts:63](https://github.com/project-chip/matter.js/blob/5f71eedebdb9fa54338bde320c311bb359b7455d/packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts#L63)

___

### maxInterval

• `Readonly` **maxInterval**: `number`

#### Defined in

[packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts:83](https://github.com/project-chip/matter.js/blob/5f71eedebdb9fa54338bde320c311bb359b7455d/packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts#L83)

___

### maxIntervalCeilingMs

• `Private` `Readonly` **maxIntervalCeilingMs**: `number`

#### Defined in

[packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts:86](https://github.com/project-chip/matter.js/blob/5f71eedebdb9fa54338bde320c311bb359b7455d/packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts#L86)

___

### minIntervalFloorMs

• `Private` `Readonly` **minIntervalFloorMs**: `number`

#### Defined in

[packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts:85](https://github.com/project-chip/matter.js/blob/5f71eedebdb9fa54338bde320c311bb359b7455d/packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts#L85)

___

### outstandingAttributeUpdates

• `Private` `Readonly` **outstandingAttributeUpdates**: `Map`\<`string`, [`AttributePathWithValueVersion`](../interfaces/protocol_interaction_export._internal_.AttributePathWithValueVersion.md)\<`any`\>\>

#### Defined in

[packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts:66](https://github.com/project-chip/matter.js/blob/5f71eedebdb9fa54338bde320c311bb359b7455d/packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts#L66)

___

### outstandingEventUpdates

• `Private` `Readonly` **outstandingEventUpdates**: `Set`\<[`EventPathWithEventData`](../interfaces/protocol_interaction_export._internal_.EventPathWithEventData.md)\<`any`\>\>

#### Defined in

[packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts:67](https://github.com/project-chip/matter.js/blob/5f71eedebdb9fa54338bde320c311bb359b7455d/packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts#L67)

___

### peerNodeId

• `Private` `Readonly` **peerNodeId**: [`NodeId`](../modules/datatype_export.md#nodeid)

#### Defined in

[packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts:89](https://github.com/project-chip/matter.js/blob/5f71eedebdb9fa54338bde320c311bb359b7455d/packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts#L89)

___

### sendDelayTimer

• `Private` `Readonly` **sendDelayTimer**: [`Timer`](../interfaces/time_export.Timer.md)

#### Defined in

[packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts:65](https://github.com/project-chip/matter.js/blob/5f71eedebdb9fa54338bde320c311bb359b7455d/packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts#L65)

___

### sendInterval

• `Readonly` **sendInterval**: `number`

#### Defined in

[packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts:84](https://github.com/project-chip/matter.js/blob/5f71eedebdb9fa54338bde320c311bb359b7455d/packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts#L84)

___

### sendNextUpdateImmediately

• `Private` **sendNextUpdateImmediately**: `boolean` = `false`

#### Defined in

[packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts:92](https://github.com/project-chip/matter.js/blob/5f71eedebdb9fa54338bde320c311bb359b7455d/packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts#L92)

___

### sendUpdateErrorCounter

• `Private` **sendUpdateErrorCounter**: `number` = `0`

#### Defined in

[packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts:93](https://github.com/project-chip/matter.js/blob/5f71eedebdb9fa54338bde320c311bb359b7455d/packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts#L93)

___

### sendUpdatesActivated

• `Private` **sendUpdatesActivated**: `boolean` = `false`

#### Defined in

[packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts:82](https://github.com/project-chip/matter.js/blob/5f71eedebdb9fa54338bde320c311bb359b7455d/packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts#L82)

___

### sendingUpdateInProgress

• `Private` **sendingUpdateInProgress**: `boolean` = `false`

#### Defined in

[packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts:91](https://github.com/project-chip/matter.js/blob/5f71eedebdb9fa54338bde320c311bb359b7455d/packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts#L91)

___

### server

• `Private` `Readonly` **server**: [`MatterDevice`](behavior_cluster_export._internal_.MatterDevice.md)

#### Defined in

[packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts:87](https://github.com/project-chip/matter.js/blob/5f71eedebdb9fa54338bde320c311bb359b7455d/packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts#L87)

___

### session

• `Private` `Readonly` **session**: [`SecureSession`](session_export.SecureSession.md)\<`any`\>

#### Defined in

[packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts:97](https://github.com/project-chip/matter.js/blob/5f71eedebdb9fa54338bde320c311bb359b7455d/packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts#L97)

___

### subscriptionId

• `Readonly` **subscriptionId**: `number`

#### Defined in

[packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts:96](https://github.com/project-chip/matter.js/blob/5f71eedebdb9fa54338bde320c311bb359b7455d/packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts#L96)

___

### updateTimer

• `Private` **updateTimer**: [`Timer`](../interfaces/time_export.Timer.md)

#### Defined in

[packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts:64](https://github.com/project-chip/matter.js/blob/5f71eedebdb9fa54338bde320c311bb359b7455d/packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts#L64)

## Methods

### activateSendingUpdates

▸ **activateSendingUpdates**(): `void`

#### Returns

`void`

#### Defined in

[packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts:404](https://github.com/project-chip/matter.js/blob/5f71eedebdb9fa54338bde320c311bb359b7455d/packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts#L404)

___

### attributeChangeListener

▸ **attributeChangeListener**\<`T`\>(`path`, `schema`, `version`, `value`): `void`

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | [`TypeFromFields`](../modules/tlv_export.md#typefromfields)\<\{ `attributeId`: [`OptionalFieldType`](../interfaces/tlv_export.OptionalFieldType.md)\<[`AttributeId`](../modules/datatype_export.md#attributeid)\> ; `clusterId`: [`OptionalFieldType`](../interfaces/tlv_export.OptionalFieldType.md)\<[`ClusterId`](../modules/datatype_export.md#clusterid)\> ; `enableTagCompression`: [`OptionalFieldType`](../interfaces/tlv_export.OptionalFieldType.md)\<`boolean`\> ; `endpointId`: [`OptionalFieldType`](../interfaces/tlv_export.OptionalFieldType.md)\<[`EndpointNumber`](../modules/datatype_export.md#endpointnumber)\> ; `listIndex`: [`OptionalFieldType`](../interfaces/tlv_export.OptionalFieldType.md)\<``null`` \| `number`\> ; `nodeId`: [`OptionalFieldType`](../interfaces/tlv_export.OptionalFieldType.md)\<[`NodeId`](../modules/datatype_export.md#nodeid)\>  }\> |
| `schema` | [`TlvSchema`](tlv_export.TlvSchema.md)\<`T`\> |
| `version` | `number` |
| `value` | `T` |

#### Returns

`void`

#### Defined in

[packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts:628](https://github.com/project-chip/matter.js/blob/5f71eedebdb9fa54338bde320c311bb359b7455d/packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts#L628)

___

### cancel

▸ **cancel**(`flush?`, `cancelledByPeer?`): `Promise`\<`void`\>

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `flush` | `boolean` | `false` |
| `cancelledByPeer` | `boolean` | `false` |

#### Returns

`Promise`\<`void`\>

#### Defined in

[packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts:669](https://github.com/project-chip/matter.js/blob/5f71eedebdb9fa54338bde320c311bb359b7455d/packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts#L669)

___

### determineSendingIntervals

▸ **determineSendingIntervals**(`subscriptionMinIntervalMs`, `subscriptionMaxIntervalMs`, `subscriptionRandomizationWindowMs`): `Object`

#### Parameters

| Name | Type |
| :------ | :------ |
| `subscriptionMinIntervalMs` | `number` |
| `subscriptionMaxIntervalMs` | `number` |
| `subscriptionRandomizationWindowMs` | `number` |

#### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `maxInterval` | `number` |
| `sendInterval` | `number` |

#### Defined in

[packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts:128](https://github.com/project-chip/matter.js/blob/5f71eedebdb9fa54338bde320c311bb359b7455d/packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts#L128)

___

### eventChangeListener

▸ **eventChangeListener**\<`T`\>(`path`, `schema`, `newEvent`): `void`

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | [`TypeFromFields`](../modules/tlv_export.md#typefromfields)\<\{ `clusterId`: [`OptionalFieldType`](../interfaces/tlv_export.OptionalFieldType.md)\<[`ClusterId`](../modules/datatype_export.md#clusterid)\> ; `endpointId`: [`OptionalFieldType`](../interfaces/tlv_export.OptionalFieldType.md)\<[`EndpointNumber`](../modules/datatype_export.md#endpointnumber)\> ; `eventId`: [`OptionalFieldType`](../interfaces/tlv_export.OptionalFieldType.md)\<[`EventId`](../modules/datatype_export.md#eventid)\> ; `isUrgent`: [`OptionalFieldType`](../interfaces/tlv_export.OptionalFieldType.md)\<`boolean`\> ; `nodeId`: [`OptionalFieldType`](../interfaces/tlv_export.OptionalFieldType.md)\<[`NodeId`](../modules/datatype_export.md#nodeid)\>  }\> |
| `schema` | [`TlvSchema`](tlv_export.TlvSchema.md)\<`T`\> |
| `newEvent` | [`EventStorageData`](../interfaces/protocol_interaction_export.EventStorageData.md)\<`T`\> |

#### Returns

`void`

#### Defined in

[packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts:648](https://github.com/project-chip/matter.js/blob/5f71eedebdb9fa54338bde320c311bb359b7455d/packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts#L648)

___

### flush

▸ **flush**(): `Promise`\<`void`\>

#### Returns

`Promise`\<`void`\>

#### Defined in

[packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts:659](https://github.com/project-chip/matter.js/blob/5f71eedebdb9fa54338bde320c311bb359b7455d/packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts#L659)

___

### getMaxInterval

▸ **getMaxInterval**(): `number`

#### Returns

`number`

#### Defined in

[packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts:396](https://github.com/project-chip/matter.js/blob/5f71eedebdb9fa54338bde320c311bb359b7455d/packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts#L396)

___

### getSendInterval

▸ **getSendInterval**(): `number`

#### Returns

`number`

#### Defined in

[packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts:400](https://github.com/project-chip/matter.js/blob/5f71eedebdb9fa54338bde320c311bb359b7455d/packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts#L400)

___

### prepareDataUpdate

▸ **prepareDataUpdate**(): `void`

Check if data should be sent straight away or delayed because the minimum interval is not reached. Delay real
sending by 50ms in any case to mke sure to catch all updates.

#### Returns

`void`

#### Defined in

[packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts:422](https://github.com/project-chip/matter.js/blob/5f71eedebdb9fa54338bde320c311bb359b7455d/packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts#L422)

___

### registerNewAttributes

▸ **registerNewAttributes**(): `Object`

#### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `attributeErrors` | [`TypeFromFields`](../modules/tlv_export.md#typefromfields)\<\{ `path`: [`FieldType`](../interfaces/tlv_export.FieldType.md)\<[`TypeFromFields`](../modules/tlv_export.md#typefromfields)\<\{ `attributeId`: [`OptionalFieldType`](../interfaces/tlv_export.OptionalFieldType.md)\<[`AttributeId`](../modules/datatype_export.md#attributeid)\> ; `clusterId`: [`OptionalFieldType`](../interfaces/tlv_export.OptionalFieldType.md)\<[`ClusterId`](../modules/datatype_export.md#clusterid)\> ; `enableTagCompression`: [`OptionalFieldType`](../interfaces/tlv_export.OptionalFieldType.md)\<`boolean`\> ; `endpointId`: [`OptionalFieldType`](../interfaces/tlv_export.OptionalFieldType.md)\<[`EndpointNumber`](../modules/datatype_export.md#endpointnumber)\> ; `listIndex`: [`OptionalFieldType`](../interfaces/tlv_export.OptionalFieldType.md)\<``null`` \| `number`\> ; `nodeId`: [`OptionalFieldType`](../interfaces/tlv_export.OptionalFieldType.md)\<[`NodeId`](../modules/datatype_export.md#nodeid)\>  }\>\> ; `status`: [`FieldType`](../interfaces/tlv_export.FieldType.md)\<[`TypeFromFields`](../modules/tlv_export.md#typefromfields)\<\{ `clusterStatus`: [`OptionalFieldType`](../interfaces/tlv_export.OptionalFieldType.md)\<[`StatusCode`](../enums/protocol_interaction_export.StatusCode.md)\> ; `status`: [`OptionalFieldType`](../interfaces/tlv_export.OptionalFieldType.md)\<[`StatusCode`](../enums/protocol_interaction_export.StatusCode.md)\>  }\>\>  }\>[] |
| `newAttributes` | [`AttributeWithPath`](../interfaces/protocol_interaction_export.AttributeWithPath.md)[] |

#### Defined in

[packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts:160](https://github.com/project-chip/matter.js/blob/5f71eedebdb9fa54338bde320c311bb359b7455d/packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts#L160)

___

### registerNewEvents

▸ **registerNewEvents**(): `Object`

#### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `eventErrors` | [`TypeFromFields`](../modules/tlv_export.md#typefromfields)\<\{ `path`: [`FieldType`](../interfaces/tlv_export.FieldType.md)\<[`TypeFromFields`](../modules/tlv_export.md#typefromfields)\<\{ `clusterId`: [`OptionalFieldType`](../interfaces/tlv_export.OptionalFieldType.md)\<[`ClusterId`](../modules/datatype_export.md#clusterid)\> ; `endpointId`: [`OptionalFieldType`](../interfaces/tlv_export.OptionalFieldType.md)\<[`EndpointNumber`](../modules/datatype_export.md#endpointnumber)\> ; `eventId`: [`OptionalFieldType`](../interfaces/tlv_export.OptionalFieldType.md)\<[`EventId`](../modules/datatype_export.md#eventid)\> ; `isUrgent`: [`OptionalFieldType`](../interfaces/tlv_export.OptionalFieldType.md)\<`boolean`\> ; `nodeId`: [`OptionalFieldType`](../interfaces/tlv_export.OptionalFieldType.md)\<[`NodeId`](../modules/datatype_export.md#nodeid)\>  }\>\> ; `status`: [`FieldType`](../interfaces/tlv_export.FieldType.md)\<[`TypeFromFields`](../modules/tlv_export.md#typefromfields)\<\{ `clusterStatus`: [`OptionalFieldType`](../interfaces/tlv_export.OptionalFieldType.md)\<[`StatusCode`](../enums/protocol_interaction_export.StatusCode.md)\> ; `status`: [`OptionalFieldType`](../interfaces/tlv_export.OptionalFieldType.md)\<[`StatusCode`](../enums/protocol_interaction_export.StatusCode.md)\>  }\>\>  }\>[] |
| `newEvents` | [`EventWithPath`](../interfaces/protocol_interaction_export.EventWithPath.md)[] |

#### Defined in

[packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts:262](https://github.com/project-chip/matter.js/blob/5f71eedebdb9fa54338bde320c311bb359b7455d/packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts#L262)

___

### sendInitialReport

▸ **sendInitialReport**(`messenger`, `readAttribute`, `readEvent`): `Promise`\<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `messenger` | [`InteractionServerMessenger`](protocol_interaction_export.InteractionServerMessenger.md) |
| `readAttribute` | (`path`: [`AttributePath`](../interfaces/protocol_interaction_export.AttributePath.md), `attribute`: [`AnyAttributeServer`](../modules/cluster_export.md#anyattributeserver)\<`any`\>) => `Promise`\<`any`\> |
| `readEvent` | (`path`: [`EventPath`](../interfaces/protocol_interaction_export.EventPath.md), `event`: [`EventServer`](cluster_export.EventServer.md)\<`any`, `any`\>, `eventFilters`: `undefined` \| [`TypeFromFields`](../modules/tlv_export.md#typefromfields)\<\{ `eventMin`: [`FieldType`](../interfaces/tlv_export.FieldType.md)\<`number` \| `bigint`\> ; `nodeId`: [`OptionalFieldType`](../interfaces/tlv_export.OptionalFieldType.md)\<[`NodeId`](../modules/datatype_export.md#nodeid)\>  }\>[]) => `Promise`\<[`EventStorageData`](../interfaces/protocol_interaction_export.EventStorageData.md)\<`any`\>[]\> |

#### Returns

`Promise`\<`void`\>

#### Defined in

[packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts:503](https://github.com/project-chip/matter.js/blob/5f71eedebdb9fa54338bde320c311bb359b7455d/packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts#L503)

___

### sendUpdate

▸ **sendUpdate**(): `Promise`\<`void`\>

Determine all attributes that have changed since the last update and send them tout to the subscriber.

#### Returns

`Promise`\<`void`\>

#### Defined in

[packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts:454](https://github.com/project-chip/matter.js/blob/5f71eedebdb9fa54338bde320c311bb359b7455d/packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts#L454)

___

### sendUpdateMessage

▸ **sendUpdateMessage**(`attributes`, `events`): `Promise`\<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `attributes` | [`AttributePathWithValueVersion`](../interfaces/protocol_interaction_export._internal_.AttributePathWithValueVersion.md)\<`any`\>[] |
| `events` | [`EventPathWithEventData`](../interfaces/protocol_interaction_export._internal_.EventPathWithEventData.md)\<`any`\>[] |

#### Returns

`Promise`\<`void`\>

#### Defined in

[packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts:685](https://github.com/project-chip/matter.js/blob/5f71eedebdb9fa54338bde320c311bb359b7455d/packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts#L685)

___

### unregisterAttributeListeners

▸ **unregisterAttributeListeners**(`list`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `list` | `string`[] |

#### Returns

`void`

#### Defined in

[packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts:249](https://github.com/project-chip/matter.js/blob/5f71eedebdb9fa54338bde320c311bb359b7455d/packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts#L249)

___

### unregisterEventListeners

▸ **unregisterEventListeners**(`list`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `list` | `string`[] |

#### Returns

`void`

#### Defined in

[packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts:333](https://github.com/project-chip/matter.js/blob/5f71eedebdb9fa54338bde320c311bb359b7455d/packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts#L333)

___

### updateSubscription

▸ **updateSubscription**(): `void`

Update the session after an endpoint structure change. The method will initialize all missing new attributes and
events and will remove listeners no longer needed.
Newly added attributes are then treated ad "changed values" and will be sent as subscription data update to the
controller. The data of newly added events are not sent automatically.

#### Returns

`void`

#### Defined in

[packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts:352](https://github.com/project-chip/matter.js/blob/5f71eedebdb9fa54338bde320c311bb359b7455d/packages/matter.js/src/protocol/interaction/SubscriptionHandler.ts#L352)

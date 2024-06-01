[@project-chip/matter.js](../README.md) / [Modules](../modules.md) / [behavior/cluster/export](../modules/behavior_cluster_export.md) / [\<internal\>](../modules/behavior_cluster_export._internal_.md) / [EndpointType](../modules/behavior_cluster_export._internal_.EndpointType.md) / Requirements

# Interface: Requirements

[\<internal\>](../modules/behavior_cluster_export._internal_.md).[EndpointType](../modules/behavior_cluster_export._internal_.EndpointType.md).Requirements

Standard dependencies for an endpoint per the Matter specification.

## Table of contents

### Properties

- [client](behavior_cluster_export._internal_.EndpointType.Requirements.md#client)
- [server](behavior_cluster_export._internal_.EndpointType.Requirements.md#server)

## Properties

### client

• `Optional` **client**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `mandatory?` | [`SupportedBehaviors`](../modules/behavior_cluster_export._internal_.md#supportedbehaviors) |
| `optional?` | [`SupportedBehaviors`](../modules/behavior_cluster_export._internal_.md#supportedbehaviors) |

#### Defined in

[packages/matter.js/src/endpoint/type/EndpointType.ts:77](https://github.com/project-chip/matter.js/blob/5f71eedebdb9fa54338bde320c311bb359b7455d/packages/matter.js/src/endpoint/type/EndpointType.ts#L77)

___

### server

• `Optional` **server**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `mandatory?` | [`SupportedBehaviors`](../modules/behavior_cluster_export._internal_.md#supportedbehaviors) |
| `optional?` | [`SupportedBehaviors`](../modules/behavior_cluster_export._internal_.md#supportedbehaviors) |

#### Defined in

[packages/matter.js/src/endpoint/type/EndpointType.ts:72](https://github.com/project-chip/matter.js/blob/5f71eedebdb9fa54338bde320c311bb359b7455d/packages/matter.js/src/endpoint/type/EndpointType.ts#L72)

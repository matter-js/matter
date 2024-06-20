[@project-chip/matter.js](../README.md) / [Modules](../modules.md) / [endpoint/export](endpoint_export.md) / Agent

# Namespace: Agent

[endpoint/export](endpoint_export.md).Agent

## Table of contents

### Interfaces

- [Internal](../interfaces/endpoint_export.Agent.Internal.md)
- [Type](../interfaces/endpoint_export.Agent.Type.md)

### Type Aliases

- [Instance](endpoint_export.Agent.md#instance)

## Type Aliases

### Instance

Ƭ **Instance**\<`T`\>: [`Agent`](../classes/endpoint_export.Agent-1.md) & \{ readonly [K in keyof T["behaviors"] & string]: InstanceType\<T["behaviors"][K]\> }

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends [`EndpointType`](../interfaces/behavior_cluster_export._internal_.EndpointType-1.md) = [`Empty`](../interfaces/behavior_cluster_export._internal_.Empty.md) |

#### Defined in

[packages/matter.js/src/endpoint/Agent.ts:166](https://github.com/project-chip/matter.js/blob/6d3b6a5d957d88a9231d6ecab4bb41f8133112be/packages/matter.js/src/endpoint/Agent.ts#L166)

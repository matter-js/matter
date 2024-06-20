[@project-chip/matter.js](../README.md) / [Modules](../modules.md) / [cluster/export](../modules/cluster_export.md) / [ThreadNetworkDiagnostics](../modules/cluster_export.ThreadNetworkDiagnostics.md) / NetworkFaultChangeEvent

# Interface: NetworkFaultChangeEvent

[cluster/export](../modules/cluster_export.md).[ThreadNetworkDiagnostics](../modules/cluster_export.ThreadNetworkDiagnostics.md).NetworkFaultChangeEvent

Body of the ThreadNetworkDiagnostics networkFaultChange event

**`See`**

MatterSpecification.v11.Core § 11.13.8.1

## Hierarchy

- [`TypeFromSchema`](../modules/tlv_export.md#typefromschema)\<typeof [`TlvNetworkFaultChangeEvent`](../modules/cluster_export.ThreadNetworkDiagnostics.md#tlvnetworkfaultchangeevent)\>

  ↳ **`NetworkFaultChangeEvent`**

## Table of contents

### Properties

- [current](cluster_export.ThreadNetworkDiagnostics.NetworkFaultChangeEvent.md#current)
- [previous](cluster_export.ThreadNetworkDiagnostics.NetworkFaultChangeEvent.md#previous)

## Properties

### current

• **current**: [`NetworkFault`](../enums/cluster_export.ThreadNetworkDiagnostics.NetworkFault.md)[]

This field shall represent the set of faults currently detected, as per Section 11.13.5.1,
“NetworkFaultEnum”.

**`See`**

MatterSpecification.v11.Core § 11.13.8.1.1

#### Inherited from

TypeFromSchema.current

#### Defined in

[packages/matter.js/src/cluster/definitions/ThreadNetworkDiagnosticsCluster.ts:469](https://github.com/project-chip/matter.js/blob/6d3b6a5d957d88a9231d6ecab4bb41f8133112be/packages/matter.js/src/cluster/definitions/ThreadNetworkDiagnosticsCluster.ts#L469)

___

### previous

• **previous**: [`NetworkFault`](../enums/cluster_export.ThreadNetworkDiagnostics.NetworkFault.md)[]

This field shall represent the set of faults detected prior to this change event, as per Section 11.13.5.1,
“NetworkFaultEnum”.

**`See`**

MatterSpecification.v11.Core § 11.13.8.1.2

#### Inherited from

TypeFromSchema.previous

#### Defined in

[packages/matter.js/src/cluster/definitions/ThreadNetworkDiagnosticsCluster.ts:477](https://github.com/project-chip/matter.js/blob/6d3b6a5d957d88a9231d6ecab4bb41f8133112be/packages/matter.js/src/cluster/definitions/ThreadNetworkDiagnosticsCluster.ts#L477)

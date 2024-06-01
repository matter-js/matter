[@project-chip/matter.js](../README.md) / [Modules](../modules.md) / [cluster/export](../modules/cluster_export.md) / [GeneralDiagnostics](../modules/cluster_export.GeneralDiagnostics.md) / NetworkFaultChangeEvent

# Interface: NetworkFaultChangeEvent

[cluster/export](../modules/cluster_export.md).[GeneralDiagnostics](../modules/cluster_export.GeneralDiagnostics.md).NetworkFaultChangeEvent

Body of the GeneralDiagnostics networkFaultChange event

**`See`**

MatterSpecification.v11.Core § 11.11.8.3

## Hierarchy

- [`TypeFromSchema`](../modules/tlv_export.md#typefromschema)\<typeof [`TlvNetworkFaultChangeEvent`](../modules/cluster_export.GeneralDiagnostics.md#tlvnetworkfaultchangeevent)\>

  ↳ **`NetworkFaultChangeEvent`**

## Table of contents

### Properties

- [current](cluster_export.GeneralDiagnostics.NetworkFaultChangeEvent.md#current)
- [previous](cluster_export.GeneralDiagnostics.NetworkFaultChangeEvent.md#previous)

## Properties

### current

• **current**: [`NetworkFault`](../enums/cluster_export.GeneralDiagnostics.NetworkFault.md)[]

This field shall represent the set of faults currently detected, as per Section 11.11.4.3,
“NetworkFaultEnum”.

**`See`**

MatterSpecification.v11.Core § 11.11.8.3.1

#### Inherited from

TypeFromSchema.current

#### Defined in

[packages/matter.js/src/cluster/definitions/GeneralDiagnosticsCluster.ts:440](https://github.com/project-chip/matter.js/blob/5f71eedebdb9fa54338bde320c311bb359b7455d/packages/matter.js/src/cluster/definitions/GeneralDiagnosticsCluster.ts#L440)

___

### previous

• **previous**: [`NetworkFault`](../enums/cluster_export.GeneralDiagnostics.NetworkFault.md)[]

This field shall represent the set of faults detected prior to this change event, as per Section 11.11.4.3,
“NetworkFaultEnum”.

**`See`**

MatterSpecification.v11.Core § 11.11.8.3.2

#### Inherited from

TypeFromSchema.previous

#### Defined in

[packages/matter.js/src/cluster/definitions/GeneralDiagnosticsCluster.ts:448](https://github.com/project-chip/matter.js/blob/5f71eedebdb9fa54338bde320c311bb359b7455d/packages/matter.js/src/cluster/definitions/GeneralDiagnosticsCluster.ts#L448)

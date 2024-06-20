[@project-chip/matter.js](../README.md) / [Modules](../modules.md) / [cluster/export](../modules/cluster_export.md) / [WiFiNetworkDiagnostics](../modules/cluster_export.WiFiNetworkDiagnostics.md) / Feature

# Enumeration: Feature

[cluster/export](../modules/cluster_export.md).[WiFiNetworkDiagnostics](../modules/cluster_export.WiFiNetworkDiagnostics.md).Feature

These are optional features supported by WiFiNetworkDiagnosticsCluster.

**`See`**

MatterSpecification.v11.Core § 11.14.4

## Table of contents

### Enumeration Members

- [ErrorCounts](cluster_export.WiFiNetworkDiagnostics.Feature.md#errorcounts)
- [PacketCounts](cluster_export.WiFiNetworkDiagnostics.Feature.md#packetcounts)

## Enumeration Members

### ErrorCounts

• **ErrorCounts** = ``"ErrorCounts"``

ErrorCounts

Node makes available the counts for the number of errors that have occurred during the reception and
transmission of packets on the Wi-Fi interface.

#### Defined in

[packages/matter.js/src/cluster/definitions/WiFiNetworkDiagnosticsCluster.ts:328](https://github.com/project-chip/matter.js/blob/6d3b6a5d957d88a9231d6ecab4bb41f8133112be/packages/matter.js/src/cluster/definitions/WiFiNetworkDiagnosticsCluster.ts#L328)

___

### PacketCounts

• **PacketCounts** = ``"PacketCounts"``

PacketCounts

Node makes available the counts for the number of received and transmitted packets on the Wi-Fi interface.

#### Defined in

[packages/matter.js/src/cluster/definitions/WiFiNetworkDiagnosticsCluster.ts:320](https://github.com/project-chip/matter.js/blob/6d3b6a5d957d88a9231d6ecab4bb41f8133112be/packages/matter.js/src/cluster/definitions/WiFiNetworkDiagnosticsCluster.ts#L320)

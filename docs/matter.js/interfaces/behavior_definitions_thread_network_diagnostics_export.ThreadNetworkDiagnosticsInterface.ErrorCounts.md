[@project-chip/matter.js](../README.md) / [Modules](../modules.md) / [behavior/definitions/thread-network-diagnostics/export](../modules/behavior_definitions_thread_network_diagnostics_export.md) / [ThreadNetworkDiagnosticsInterface](../modules/behavior_definitions_thread_network_diagnostics_export.ThreadNetworkDiagnosticsInterface.md) / ErrorCounts

# Interface: ErrorCounts

[behavior/definitions/thread-network-diagnostics/export](../modules/behavior_definitions_thread_network_diagnostics_export.md).[ThreadNetworkDiagnosticsInterface](../modules/behavior_definitions_thread_network_diagnostics_export.ThreadNetworkDiagnosticsInterface.md).ErrorCounts

## Table of contents

### Methods

- [resetCounts](behavior_definitions_thread_network_diagnostics_export.ThreadNetworkDiagnosticsInterface.ErrorCounts.md#resetcounts)

## Methods

### resetCounts

▸ **resetCounts**(): [`MaybePromise`](../modules/util_export.md#maybepromise)

Reception of this command shall reset the following attributes to 0:

  • OverrunCount

This command has no associated data. Upon completion, this command shall send a status code set to a value
of SUCCESS back to the initiator.

#### Returns

[`MaybePromise`](../modules/util_export.md#maybepromise)

**`See`**

[MatterCoreSpecificationV1_1](spec_export.MatterCoreSpecificationV1_1.md) § 11.13.7.1

#### Defined in

[packages/matter.js/src/behavior/definitions/thread-network-diagnostics/ThreadNetworkDiagnosticsInterface.ts:24](https://github.com/project-chip/matter.js/blob/3adaded6/packages/matter.js/src/behavior/definitions/thread-network-diagnostics/ThreadNetworkDiagnosticsInterface.ts#L24)

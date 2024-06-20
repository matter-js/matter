[@project-chip/matter.js](../README.md) / [Modules](../modules.md) / [behavior/definitions/general-diagnostics/export](../modules/behavior_definitions_general_diagnostics_export.md) / [GeneralDiagnosticsServer](../modules/behavior_definitions_general_diagnostics_export.GeneralDiagnosticsServer.md) / State

# Class: State

[behavior/definitions/general-diagnostics/export](../modules/behavior_definitions_general_diagnostics_export.md).[GeneralDiagnosticsServer](../modules/behavior_definitions_general_diagnostics_export.GeneralDiagnosticsServer.md).State

## Hierarchy

- `State`

  ↳ **`State`**

## Table of contents

### Constructors

- [constructor](behavior_definitions_general_diagnostics_export.GeneralDiagnosticsServer.State.md#constructor)

### Properties

- [activeHardwareFaults](behavior_definitions_general_diagnostics_export.GeneralDiagnosticsServer.State.md#activehardwarefaults)
- [activeNetworkFaults](behavior_definitions_general_diagnostics_export.GeneralDiagnosticsServer.State.md#activenetworkfaults)
- [activeRadioFaults](behavior_definitions_general_diagnostics_export.GeneralDiagnosticsServer.State.md#activeradiofaults)
- [bootReason](behavior_definitions_general_diagnostics_export.GeneralDiagnosticsServer.State.md#bootreason)
- [networkInterfaces](behavior_definitions_general_diagnostics_export.GeneralDiagnosticsServer.State.md#networkinterfaces)
- [rebootCount](behavior_definitions_general_diagnostics_export.GeneralDiagnosticsServer.State.md#rebootcount)
- [testEventTriggersEnabled](behavior_definitions_general_diagnostics_export.GeneralDiagnosticsServer.State.md#testeventtriggersenabled)
- [totalOperationalHours](behavior_definitions_general_diagnostics_export.GeneralDiagnosticsServer.State.md#totaloperationalhours)
- [totalOperationalHoursCounter](behavior_definitions_general_diagnostics_export.GeneralDiagnosticsServer.State.md#totaloperationalhourscounter)
- [upTime](behavior_definitions_general_diagnostics_export.GeneralDiagnosticsServer.State.md#uptime)

### Methods

- [[properties]](behavior_definitions_general_diagnostics_export.GeneralDiagnosticsServer.State.md#[properties])

## Constructors

### constructor

• **new State**(): [`State`](behavior_definitions_general_diagnostics_export.GeneralDiagnosticsServer.State.md)

#### Returns

[`State`](behavior_definitions_general_diagnostics_export.GeneralDiagnosticsServer.State.md)

#### Inherited from

GeneralDiagnosticsBehavior.State.constructor

#### Defined in

[packages/matter.js/src/behavior/cluster/ClusterBehavior.ts:216](https://github.com/project-chip/matter.js/blob/6d3b6a5d957d88a9231d6ecab4bb41f8133112be/packages/matter.js/src/behavior/cluster/ClusterBehavior.ts#L216)

## Properties

### activeHardwareFaults

• `Optional` **activeHardwareFaults**: [`HardwareFault`](../enums/cluster_export.GeneralDiagnostics.HardwareFault.md)[]

The ActiveHardwareFaults attribute shall indicate the set of faults currently detected by the Node. When
the Node detects a fault has been raised, the appropriate HardwareFaultEnum value shall be added to this
list. This list shall NOT contain more than one instance of a specific HardwareFaultEnum value. When the
Node detects that all conditions contributing to a fault has been cleared, the corresponding
HardwareFaultEnum value shall be removed from this list. An empty list shall indicate there are
currently no active faults. The order of this list SHOULD have no significance. Clients interested in
monitoring changes in active faults may subscribe to this attribute, or they may subscribe to
HardwareFaultChange.

**`See`**

MatterSpecification.v11.Core § 11.11.6.6

#### Inherited from

GeneralDiagnosticsBehavior.State.activeHardwareFaults

#### Defined in

[packages/matter.js/src/cluster/definitions/GeneralDiagnosticsCluster.ts:559](https://github.com/project-chip/matter.js/blob/6d3b6a5d957d88a9231d6ecab4bb41f8133112be/packages/matter.js/src/cluster/definitions/GeneralDiagnosticsCluster.ts#L559)

___

### activeNetworkFaults

• `Optional` **activeNetworkFaults**: [`NetworkFault`](../enums/cluster_export.GeneralDiagnostics.NetworkFault.md)[]

The ActiveNetworkFaults attribute shall indicate the set of faults currently detected by the Node. When
the Node detects a fault has been raised, the appropriate NetworkFaultEnum value shall be added to this
list. This list shall NOT contain more than one instance of a specific NetworkFaultEnum value. When the
Node detects that all conditions contributing to a fault has been cleared, the corresponding
NetworkFaultEnum value shall be removed from this list. An empty list shall indicate there are currently
no active faults. The order of this list SHOULD have no significance. Clients interested in monitoring
changes in active faults may subscribe to this attribute, or they may subscribe to NetworkFaultChange.

**`See`**

MatterSpecification.v11.Core § 11.11.6.8

#### Inherited from

GeneralDiagnosticsBehavior.State.activeNetworkFaults

#### Defined in

[packages/matter.js/src/cluster/definitions/GeneralDiagnosticsCluster.ts:593](https://github.com/project-chip/matter.js/blob/6d3b6a5d957d88a9231d6ecab4bb41f8133112be/packages/matter.js/src/cluster/definitions/GeneralDiagnosticsCluster.ts#L593)

___

### activeRadioFaults

• `Optional` **activeRadioFaults**: [`RadioFault`](../enums/cluster_export.GeneralDiagnostics.RadioFault.md)[]

The ActiveRadioFaults attribute shall indicate the set of faults currently detected by the Node. When
the Node detects a fault has been raised, the appropriate RadioFaultEnum value shall be added to this
list. This list shall NOT contain more than one instance of a specific RadioFaultEnum value. When the
Node detects that all conditions contributing to a fault has been cleared, the corresponding
RadioFaultEnum value shall be removed from this list. An empty list shall indicate there are currently
no active faults. The order of this list SHOULD have no significance. Clients interested in monitoring
changes in active faults may subscribe to this attribute, or they may subscribe to RadioFaultChange.

**`See`**

MatterSpecification.v11.Core § 11.11.6.7

#### Inherited from

GeneralDiagnosticsBehavior.State.activeRadioFaults

#### Defined in

[packages/matter.js/src/cluster/definitions/GeneralDiagnosticsCluster.ts:576](https://github.com/project-chip/matter.js/blob/6d3b6a5d957d88a9231d6ecab4bb41f8133112be/packages/matter.js/src/cluster/definitions/GeneralDiagnosticsCluster.ts#L576)

___

### bootReason

• `Optional` **bootReason**: [`BootReason`](../enums/cluster_export.GeneralDiagnostics.BootReason.md)

The BootReason attribute shall indicate the reason for the Node’s most recent boot.

**`See`**

MatterSpecification.v11.Core § 11.11.6.5

#### Inherited from

GeneralDiagnosticsBehavior.State.bootReason

#### Defined in

[packages/matter.js/src/cluster/definitions/GeneralDiagnosticsCluster.ts:545](https://github.com/project-chip/matter.js/blob/6d3b6a5d957d88a9231d6ecab4bb41f8133112be/packages/matter.js/src/cluster/definitions/GeneralDiagnosticsCluster.ts#L545)

___

### networkInterfaces

• **networkInterfaces**: [`TypeFromFields`](../modules/tlv_export.md#typefromfields)\<\{ `hardwareAddress`: [`FieldType`](../interfaces/tlv_export.FieldType.md)\<`Uint8Array`\> ; `iPv4Addresses`: [`FieldType`](../interfaces/tlv_export.FieldType.md)\<`Uint8Array`[]\> ; `iPv6Addresses`: [`FieldType`](../interfaces/tlv_export.FieldType.md)\<`Uint8Array`[]\> ; `isOperational`: [`FieldType`](../interfaces/tlv_export.FieldType.md)\<`boolean`\> ; `name`: [`FieldType`](../interfaces/tlv_export.FieldType.md)\<`string`\> ; `offPremiseServicesReachableIPv4`: [`FieldType`](../interfaces/tlv_export.FieldType.md)\<``null`` \| `boolean`\> ; `offPremiseServicesReachableIPv6`: [`FieldType`](../interfaces/tlv_export.FieldType.md)\<``null`` \| `boolean`\> ; `type`: [`FieldType`](../interfaces/tlv_export.FieldType.md)\<[`InterfaceType`](../enums/cluster_export.GeneralDiagnostics.InterfaceType.md)\>  }\>[]

The NetworkInterfaces attribute shall be a list of NetworkInterface structs. Each logical network
interface on the Node shall be represented by a single entry within the NetworkInterfaces attribute.

**`See`**

MatterSpecification.v11.Core § 11.11.6.1

#### Inherited from

GeneralDiagnosticsBehavior.State.networkInterfaces

#### Defined in

[packages/matter.js/src/cluster/definitions/GeneralDiagnosticsCluster.ts:503](https://github.com/project-chip/matter.js/blob/6d3b6a5d957d88a9231d6ecab4bb41f8133112be/packages/matter.js/src/cluster/definitions/GeneralDiagnosticsCluster.ts#L503)

___

### rebootCount

• **rebootCount**: `number`

The RebootCount attribute shall indicate a best-effort count of the number of times the Node has
rebooted. The RebootCount attribute SHOULD be incremented each time the Node reboots. The RebootCount
attribute shall NOT be incremented when a Node wakes from a low-power or sleep state. The RebootCount
attribute shall only be reset to 0 upon a factory reset of the Node.

**`See`**

MatterSpecification.v11.Core § 11.11.6.2

#### Inherited from

GeneralDiagnosticsBehavior.State.rebootCount

#### Defined in

[packages/matter.js/src/cluster/definitions/GeneralDiagnosticsCluster.ts:513](https://github.com/project-chip/matter.js/blob/6d3b6a5d957d88a9231d6ecab4bb41f8133112be/packages/matter.js/src/cluster/definitions/GeneralDiagnosticsCluster.ts#L513)

___

### testEventTriggersEnabled

• **testEventTriggersEnabled**: `boolean`

The TestEventTriggersEnabled attribute shall indicate whether the Node has any TestEventTrigger
configured. When this attribute is true, the Node has been configured with one or more test event
triggers by virtue of the internally programmed EnableKey value (see Section 11.11.7.1,
“TestEventTrigger Command”) being set to a non-zero value. This attribute can be used by Administrators
to detect if a device was inadvertently commissioned with test event trigger mode enabled, and take
appropriate action (e.g. warn the user and/or offer to remove all fabrics on the Node).

**`See`**

MatterSpecification.v11.Core § 11.11.6.9

#### Inherited from

GeneralDiagnosticsBehavior.State.testEventTriggersEnabled

#### Defined in

[packages/matter.js/src/cluster/definitions/GeneralDiagnosticsCluster.ts:609](https://github.com/project-chip/matter.js/blob/6d3b6a5d957d88a9231d6ecab4bb41f8133112be/packages/matter.js/src/cluster/definitions/GeneralDiagnosticsCluster.ts#L609)

___

### totalOperationalHours

• `Optional` **totalOperationalHours**: `number`

The TotalOperationalHours attribute shall indicate a best-effort attempt at tracking the length of time,
in hours, that the Node has been operational. The TotalOperationalHours attribute SHOULD be incremented
to account for the periods of time that a Node is in a low-power or sleep state. The

TotalOperationalHours attribute shall only be reset upon a factory reset of the Node.

**`See`**

MatterSpecification.v11.Core § 11.11.6.4

#### Inherited from

GeneralDiagnosticsBehavior.State.totalOperationalHours

#### Defined in

[packages/matter.js/src/cluster/definitions/GeneralDiagnosticsCluster.ts:534](https://github.com/project-chip/matter.js/blob/6d3b6a5d957d88a9231d6ecab4bb41f8133112be/packages/matter.js/src/cluster/definitions/GeneralDiagnosticsCluster.ts#L534)

___

### totalOperationalHoursCounter

• **totalOperationalHoursCounter**: `number` = `0`

Internal counter of the total operational hours, counted in seconds, updated every 5 minutes.

#### Defined in

[packages/matter.js/src/behavior/definitions/general-diagnostics/GeneralDiagnosticsServer.ts:297](https://github.com/project-chip/matter.js/blob/6d3b6a5d957d88a9231d6ecab4bb41f8133112be/packages/matter.js/src/behavior/definitions/general-diagnostics/GeneralDiagnosticsServer.ts#L297)

___

### upTime

• `Optional` **upTime**: `number` \| `bigint`

The UpTime attribute shall indicate a best-effort assessment of the length of time, in seconds, since
the Node’s last reboot. The UpTime attribute SHOULD be incremented to account for the periods of time
that a Node is in a low-power or sleep state. The UpTime attribute shall only be reset upon a device
reboot.

**`See`**

MatterSpecification.v11.Core § 11.11.6.3

#### Inherited from

GeneralDiagnosticsBehavior.State.upTime

#### Defined in

[packages/matter.js/src/cluster/definitions/GeneralDiagnosticsCluster.ts:523](https://github.com/project-chip/matter.js/blob/6d3b6a5d957d88a9231d6ecab4bb41f8133112be/packages/matter.js/src/cluster/definitions/GeneralDiagnosticsCluster.ts#L523)

## Methods

### [properties]

▸ **[properties]**(`endpoint`, `_session`): `Object`

#### Parameters

| Name | Type |
| :------ | :------ |
| `endpoint` | [`Endpoint`](endpoint_export.Endpoint-1.md)\<[`Empty`](../interfaces/behavior_cluster_export._internal_.Empty.md)\> |
| `_session` | [`Session`](../interfaces/behavior_cluster_export._internal_.Session.md) |

#### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `get totalOperationalHours()` | `number` |
| `get upTime()` | `number` |

#### Defined in

[packages/matter.js/src/behavior/definitions/general-diagnostics/GeneralDiagnosticsServer.ts:299](https://github.com/project-chip/matter.js/blob/6d3b6a5d957d88a9231d6ecab4bb41f8133112be/packages/matter.js/src/behavior/definitions/general-diagnostics/GeneralDiagnosticsServer.ts#L299)

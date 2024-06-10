[@project-chip/matter.js](../README.md) / [Modules](../modules.md) / [behavior/cluster/export](behavior_cluster_export.md) / ClusterInterface

# Namespace: ClusterInterface

[behavior/cluster/export](behavior_cluster_export.md).ClusterInterface

## Table of contents

### Interfaces

- [Component](../interfaces/behavior_cluster_export.ClusterInterface.Component.md)
- [Empty](../interfaces/behavior_cluster_export.ClusterInterface.Empty.md)

### Type Aliases

- [ApplicableComponents](behavior_cluster_export.ClusterInterface.md#applicablecomponents)
- [AppliedMethodsOf](behavior_cluster_export.ClusterInterface.md#appliedmethodsof)
- [InterfaceMethodsOf](behavior_cluster_export.ClusterInterface.md#interfacemethodsof)
- [InterfaceOf](behavior_cluster_export.ClusterInterface.md#interfaceof)
- [MappedMethodsOf](behavior_cluster_export.ClusterInterface.md#mappedmethodsof)
- [MethodForCommand](behavior_cluster_export.ClusterInterface.md#methodforcommand)
- [MethodsOf](behavior_cluster_export.ClusterInterface.md#methodsof)

### Variables

- [Empty](behavior_cluster_export.ClusterInterface.md#empty)

## Type Aliases

### ApplicableComponents

Ƭ **ApplicableComponents**\<`CA`, `S`\>: `CA` extends [infer C, ...(infer R extends Component[])] ? `S` extends `C`[``"flags"``] ? [`C`, ...ApplicableComponents\<R, S\>] : [`ApplicableComponents`](behavior_cluster_export.ClusterInterface.md#applicablecomponents)\<`R`, `S`\> : []

#### Type parameters

| Name | Type |
| :------ | :------ |
| `CA` | extends [`Component`](../interfaces/behavior_cluster_export.ClusterInterface.Component.md)[] |
| `S` | extends [`FeatureFlags`](cluster_export.ClusterComposer.md#featureflags) |

#### Defined in

[packages/matter.js/src/behavior/cluster/ClusterInterface.ts:78](https://github.com/project-chip/matter.js/blob/5f71eedebdb9fa54338bde320c311bb359b7455d/packages/matter.js/src/behavior/cluster/ClusterInterface.ts#L78)

___

### AppliedMethodsOf

Ƭ **AppliedMethodsOf**\<`CA`\>: `CA` extends [infer C, ...(infer R extends Component[])] ? `C`[``"methods"``] & [`AppliedMethodsOf`](behavior_cluster_export.ClusterInterface.md#appliedmethodsof)\<`R`\> : {}

#### Type parameters

| Name | Type |
| :------ | :------ |
| `CA` | extends [`Component`](../interfaces/behavior_cluster_export.ClusterInterface.Component.md)[] |

#### Defined in

[packages/matter.js/src/behavior/cluster/ClusterInterface.ts:71](https://github.com/project-chip/matter.js/blob/5f71eedebdb9fa54338bde320c311bb359b7455d/packages/matter.js/src/behavior/cluster/ClusterInterface.ts#L71)

___

### InterfaceMethodsOf

Ƭ **InterfaceMethodsOf**\<`I`, `S`\>: [`ClusterInterface`](behavior_cluster_export.md#clusterinterface) extends `I` ? {} : [`AppliedMethodsOf`](behavior_cluster_export.ClusterInterface.md#appliedmethodsof)\<[`ApplicableComponents`](behavior_cluster_export.ClusterInterface.md#applicablecomponents)\<`I`[``"components"``], `S`\>\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `I` | extends [`ClusterInterface`](behavior_cluster_export.md#clusterinterface) |
| `S` | extends [`FeatureFlags`](cluster_export.ClusterComposer.md#featureflags) |

#### Defined in

[packages/matter.js/src/behavior/cluster/ClusterInterface.ts:66](https://github.com/project-chip/matter.js/blob/5f71eedebdb9fa54338bde320c311bb359b7455d/packages/matter.js/src/behavior/cluster/ClusterInterface.ts#L66)

___

### InterfaceOf

Ƭ **InterfaceOf**\<`B`\>: `B` extends \{ `Interface`: infer I  } ? `I` : [`ClusterInterface`](behavior_cluster_export.md#clusterinterface)

#### Type parameters

| Name |
| :------ |
| `B` |

#### Defined in

[packages/matter.js/src/behavior/cluster/ClusterInterface.ts:58](https://github.com/project-chip/matter.js/blob/5f71eedebdb9fa54338bde320c311bb359b7455d/packages/matter.js/src/behavior/cluster/ClusterInterface.ts#L58)

___

### MappedMethodsOf

Ƭ **MappedMethodsOf**\<`C`\>: `string` extends keyof `C` ? {} : \{ readonly [K in keyof C as C[K] extends Object ? never : K]: MethodForCommand\<C[K]\> } & \{ readonly [K in keyof C as C[K] extends Object ? K : never]?: MethodForCommand\<C[K]\> }

#### Type parameters

| Name | Type |
| :------ | :------ |
| `C` | extends `Record`\<`string`, [`Command`](cluster_export.ClusterType.md#command)\> |

#### Defined in

[packages/matter.js/src/behavior/cluster/ClusterInterface.ts:91](https://github.com/project-chip/matter.js/blob/5f71eedebdb9fa54338bde320c311bb359b7455d/packages/matter.js/src/behavior/cluster/ClusterInterface.ts#L91)

___

### MethodForCommand

Ƭ **MethodForCommand**\<`C`\>: (`request`: [`TypeFromSchema`](tlv_export.md#typefromschema)\<`C`[``"requestSchema"``]\>) => [`MaybePromise`](util_export.md#maybepromise)\<[`TypeFromSchema`](tlv_export.md#typefromschema)\<`C`[``"responseSchema"``]\>\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `C` | extends [`Command`](cluster_export.ClusterType.md#command) |

#### Type declaration

▸ (`request`): [`MaybePromise`](util_export.md#maybepromise)\<[`TypeFromSchema`](tlv_export.md#typefromschema)\<`C`[``"responseSchema"``]\>\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`TypeFromSchema`](tlv_export.md#typefromschema)\<`C`[``"requestSchema"``]\> |

##### Returns

[`MaybePromise`](util_export.md#maybepromise)\<[`TypeFromSchema`](tlv_export.md#typefromschema)\<`C`[``"responseSchema"``]\>\>

#### Defined in

[packages/matter.js/src/behavior/cluster/ClusterInterface.ts:87](https://github.com/project-chip/matter.js/blob/5f71eedebdb9fa54338bde320c311bb359b7455d/packages/matter.js/src/behavior/cluster/ClusterInterface.ts#L87)

___

### MethodsOf

Ƭ **MethodsOf**\<`I`, `C`\>: [`InterfaceMethodsOf`](behavior_cluster_export.ClusterInterface.md#interfacemethodsof)\<`I`, `C`[``"supportedFeatures"``]\> & `Omit`\<[`MappedMethodsOf`](behavior_cluster_export.ClusterInterface.md#mappedmethodsof)\<`C`[``"commands"``]\>, keyof [`InterfaceMethodsOf`](behavior_cluster_export.ClusterInterface.md#interfacemethodsof)\<`I`, `C`[``"supportedFeatures"``]\>\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `I` | extends [`ClusterInterface`](behavior_cluster_export.md#clusterinterface) |
| `C` | extends [`ClusterType`](../interfaces/cluster_export.ClusterType-1.md) |

#### Defined in

[packages/matter.js/src/behavior/cluster/ClusterInterface.ts:60](https://github.com/project-chip/matter.js/blob/5f71eedebdb9fa54338bde320c311bb359b7455d/packages/matter.js/src/behavior/cluster/ClusterInterface.ts#L60)

## Variables

### Empty

• `Const` **Empty**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `components` | `never`[] |

#### Defined in

[packages/matter.js/src/behavior/cluster/ClusterInterface.ts:48](https://github.com/project-chip/matter.js/blob/5f71eedebdb9fa54338bde320c311bb359b7455d/packages/matter.js/src/behavior/cluster/ClusterInterface.ts#L48)

[packages/matter.js/src/behavior/cluster/ClusterInterface.ts:49](https://github.com/project-chip/matter.js/blob/5f71eedebdb9fa54338bde320c311bb359b7455d/packages/matter.js/src/behavior/cluster/ClusterInterface.ts#L49)

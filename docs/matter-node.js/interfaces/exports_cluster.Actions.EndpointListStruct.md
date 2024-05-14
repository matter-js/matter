[@project-chip/matter-node.js](../README.md) / [Modules](../modules.md) / [exports/cluster](../modules/exports_cluster.md) / [Actions](../modules/exports_cluster.Actions.md) / EndpointListStruct

# Interface: EndpointListStruct

[exports/cluster](../modules/exports_cluster.md).[Actions](../modules/exports_cluster.Actions.md).EndpointListStruct

This data type holds the details of a single endpoint list, which relates to a set of endpoints that have some
logical relation, and contains the data fields below.

**`See`**

MatterSpecification.v11.Core § 9.14.4.7

## Hierarchy

- [`TypeFromSchema`](../modules/exports_tlv.md#typefromschema)\<typeof [`TlvEndpointListStruct`](../modules/exports_cluster.Actions.md#tlvendpointliststruct)\>

  ↳ **`EndpointListStruct`**

## Table of contents

### Properties

- [endpointListId](exports_cluster.Actions.EndpointListStruct.md#endpointlistid)
- [endpoints](exports_cluster.Actions.EndpointListStruct.md#endpoints)
- [name](exports_cluster.Actions.EndpointListStruct.md#name)
- [type](exports_cluster.Actions.EndpointListStruct.md#type)

## Properties

### endpointListId

• **endpointListId**: `number`

This field shall provide an unique identifier used to identify the endpoint list.

**`See`**

MatterSpecification.v11.Core § 9.14.4.7.1

#### Inherited from

TypeFromSchema.endpointListId

#### Defined in

packages/matter.js/dist/esm/cluster/definitions/ActionsCluster.d.ts:330

___

### endpoints

• **endpoints**: [`EndpointNumber`](../modules/exports_datatype.md#endpointnumber)[]

This field shall provide a list of endpoint numbers.

**`See`**

MatterSpecification.v11.Core § 9.14.4.7.4

#### Inherited from

TypeFromSchema.endpoints

#### Defined in

packages/matter.js/dist/esm/cluster/definitions/ActionsCluster.d.ts:350

___

### name

• **name**: `string`

This field shall indicate the name (as assigned by the user or automatically by the server) associated with
the set of endpoints in this list. This can be used for identifying the action to the user by the client.
Example: "living room".

**`See`**

MatterSpecification.v11.Core § 9.14.4.7.2

#### Inherited from

TypeFromSchema.name

#### Defined in

packages/matter.js/dist/esm/cluster/definitions/ActionsCluster.d.ts:338

___

### type

• **type**: [`EndpointListType`](../enums/exports_cluster.Actions.EndpointListType.md)

This field shall indicate the type of endpoint list, see EndpointListTypeEnum.

**`See`**

MatterSpecification.v11.Core § 9.14.4.7.3

#### Inherited from

TypeFromSchema.type

#### Defined in

packages/matter.js/dist/esm/cluster/definitions/ActionsCluster.d.ts:344

[@project-chip/matter.js](../README.md) / [Modules](../modules.md) / [model](../modules/model.md) / FabricModel

# Class: FabricModel

[model](../modules/model.md).FabricModel

A "model" is a class that implements runtime functionality associated with
the corresponding element type.

## Hierarchy

- [`Model`](model.Model-1.md)

  ↳ **`FabricModel`**

## Implements

- [`FabricElement`](../modules/model.md#fabricelement)

## Table of contents

### Constructors

- [constructor](model.FabricModel.md#constructor)

### Properties

- [description](model.FabricModel.md#description)
- [details](model.FabricModel.md#details)
- [errors](model.FabricModel.md#errors)
- [global](model.FabricModel.md#global)
- [id](model.FabricModel.md#id)
- [isType](model.FabricModel.md#istype)
- [isTypeScope](model.FabricModel.md#istypescope)
- [name](model.FabricModel.md#name)
- [tag](model.FabricModel.md#tag)
- [type](model.FabricModel.md#type)
- [xref](model.FabricModel.md#xref)
- [constructors](model.FabricModel.md#constructors)

### Accessors

- [allowedBaseTags](model.FabricModel.md#allowedbasetags)
- [base](model.FabricModel.md#base)
- [children](model.FabricModel.md#children)
- [effectiveId](model.FabricModel.md#effectiveid)
- [effectiveType](model.FabricModel.md#effectivetype)
- [effectiveXref](model.FabricModel.md#effectivexref)
- [elements](model.FabricModel.md#elements)
- [globalBase](model.FabricModel.md#globalbase)
- [key](model.FabricModel.md#key)
- [nodes](model.FabricModel.md#nodes)
- [parent](model.FabricModel.md#parent)
- [path](model.FabricModel.md#path)
- [shadow](model.FabricModel.md#shadow)
- [valid](model.FabricModel.md#valid)

### Methods

- [add](model.FabricModel.md#add)
- [all](model.FabricModel.md#all)
- [error](model.FabricModel.md#error)
- [get](model.FabricModel.md#get)
- [instanceOf](model.FabricModel.md#instanceof)
- [is](model.FabricModel.md#is)
- [member](model.FabricModel.md#member)
- [owner](model.FabricModel.md#owner)
- [references](model.FabricModel.md#references)
- [toJSON](model.FabricModel.md#tojson)
- [valueOf](model.FabricModel.md#valueof)
- [visit](model.FabricModel.md#visit)
- [create](model.FabricModel.md#create)

## Constructors

### constructor

• **new FabricModel**(`definition`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `definition` | [`Properties`](../modules/model.FabricElement.md#properties) |

#### Overrides

[Model](model.Model-1.md).[constructor](model.Model-1.md#constructor)

#### Defined in

[packages/matter.js/src/model/models/FabricModel.ts:27](https://github.com/project-chip/matter.js/blob/b7330d72/packages/matter.js/src/model/models/FabricModel.ts#L27)

## Properties

### description

• `Optional` **description**: `string`

#### Implementation of

FabricElement.description

#### Inherited from

[Model](model.Model-1.md).[description](model.Model-1.md#description)

#### Defined in

[packages/matter.js/src/model/models/Model.ts:26](https://github.com/project-chip/matter.js/blob/b7330d72/packages/matter.js/src/model/models/Model.ts#L26)

___

### details

• `Optional` **details**: `string`

#### Implementation of

FabricElement.details

#### Inherited from

[Model](model.Model-1.md).[details](model.Model-1.md#details)

#### Defined in

[packages/matter.js/src/model/models/Model.ts:27](https://github.com/project-chip/matter.js/blob/b7330d72/packages/matter.js/src/model/models/Model.ts#L27)

___

### errors

• `Optional` **errors**: [`DefinitionError`](../modules/model.md#definitionerror)[]

#### Inherited from

[Model](model.Model-1.md).[errors](model.Model-1.md#errors)

#### Defined in

[packages/matter.js/src/model/models/Model.ts:29](https://github.com/project-chip/matter.js/blob/b7330d72/packages/matter.js/src/model/models/Model.ts#L29)

___

### global

• `Optional` **global**: `boolean`

Flag set on elements loaded from Globals.

#### Implementation of

FabricElement.global

#### Inherited from

[Model](model.Model-1.md).[global](model.Model-1.md#global)

#### Defined in

[packages/matter.js/src/model/models/Model.ts:34](https://github.com/project-chip/matter.js/blob/b7330d72/packages/matter.js/src/model/models/Model.ts#L34)

___

### id

• **id**: `number`

#### Implementation of

FabricElement.id

#### Overrides

[Model](model.Model-1.md).[id](model.Model-1.md#id)

#### Defined in

[packages/matter.js/src/model/models/FabricModel.ts:13](https://github.com/project-chip/matter.js/blob/b7330d72/packages/matter.js/src/model/models/FabricModel.ts#L13)

___

### isType

• `Optional` **isType**: `boolean`

Indicates that an element defines a datatype.

#### Inherited from

[Model](model.Model-1.md).[isType](model.Model-1.md#istype)

#### Defined in

[packages/matter.js/src/model/models/Model.ts:44](https://github.com/project-chip/matter.js/blob/b7330d72/packages/matter.js/src/model/models/Model.ts#L44)

___

### isTypeScope

• `Optional` **isTypeScope**: `boolean`

Indicates that an element may have type definitions as children.

#### Inherited from

[Model](model.Model-1.md).[isTypeScope](model.Model-1.md#istypescope)

#### Defined in

[packages/matter.js/src/model/models/Model.ts:39](https://github.com/project-chip/matter.js/blob/b7330d72/packages/matter.js/src/model/models/Model.ts#L39)

___

### name

• **name**: `string`

#### Implementation of

FabricElement.name

#### Inherited from

[Model](model.Model-1.md).[name](model.Model-1.md#name)

#### Defined in

[packages/matter.js/src/model/models/Model.ts:24](https://github.com/project-chip/matter.js/blob/b7330d72/packages/matter.js/src/model/models/Model.ts#L24)

___

### tag

• **tag**: [`Fabric`](../enums/model.ElementTag.md#fabric) = `FabricElement.Tag`

#### Implementation of

FabricElement.tag

#### Overrides

[Model](model.Model-1.md).[tag](model.Model-1.md#tag)

#### Defined in

[packages/matter.js/src/model/models/FabricModel.ts:12](https://github.com/project-chip/matter.js/blob/b7330d72/packages/matter.js/src/model/models/FabricModel.ts#L12)

___

### type

• `Optional` **type**: `string`

#### Implementation of

FabricElement.type

#### Inherited from

[Model](model.Model-1.md).[type](model.Model-1.md#type)

#### Defined in

[packages/matter.js/src/model/models/Model.ts:25](https://github.com/project-chip/matter.js/blob/b7330d72/packages/matter.js/src/model/models/Model.ts#L25)

___

### xref

• `Optional` **xref**: [`CrossReference`](model.Model.CrossReference.md)

#### Implementation of

FabricElement.xref

#### Inherited from

[Model](model.Model-1.md).[xref](model.Model-1.md#xref)

#### Defined in

[packages/matter.js/src/model/models/Model.ts:28](https://github.com/project-chip/matter.js/blob/b7330d72/packages/matter.js/src/model/models/Model.ts#L28)

___

### constructors

▪ `Static` **constructors**: `Object`

Factory support.  Populated by derivatives upon definition.

#### Index signature

▪ [type: `string`]: (`definition`: `any`) => [`Model`](model.Model-1.md)

#### Inherited from

[Model](model.Model-1.md).[constructors](model.Model-1.md#constructors)

#### Defined in

[packages/matter.js/src/model/models/Model.ts:192](https://github.com/project-chip/matter.js/blob/b7330d72/packages/matter.js/src/model/models/Model.ts#L192)

## Accessors

### allowedBaseTags

• `get` **allowedBaseTags**(): [`ElementTag`](../enums/model.ElementTag.md)[]

The set of tags from which this model may derive.

#### Returns

[`ElementTag`](../enums/model.ElementTag.md)[]

#### Inherited from

Model.allowedBaseTags

#### Defined in

[packages/matter.js/src/model/models/Model.ts:237](https://github.com/project-chip/matter.js/blob/b7330d72/packages/matter.js/src/model/models/Model.ts#L237)

___

### base

• `get` **base**(): `undefined` \| [`Model`](model.Model-1.md)

Get a Model for my base type, if any.

#### Returns

`undefined` \| [`Model`](model.Model-1.md)

#### Inherited from

Model.base

#### Defined in

[packages/matter.js/src/model/models/Model.ts:207](https://github.com/project-chip/matter.js/blob/b7330d72/packages/matter.js/src/model/models/Model.ts#L207)

___

### children

• `get` **children**(): [`NodeModel`](model.NodeModel.md)[]

Children of models are always models.

#### Returns

[`NodeModel`](model.NodeModel.md)[]

#### Implementation of

FabricElement.children

#### Overrides

Model.children

#### Defined in

[packages/matter.js/src/model/models/FabricModel.ts:19](https://github.com/project-chip/matter.js/blob/b7330d72/packages/matter.js/src/model/models/FabricModel.ts#L19)

• `set` **children**(`children`): `void`

Children can be added as models or elements.

#### Parameters

| Name | Type |
| :------ | :------ |
| `children` | ([`NodeElement`](../modules/model.md#nodeelement) \| [`NodeModel`](model.NodeModel.md))[] |

#### Returns

`void`

#### Implementation of

FabricElement.children

#### Overrides

Model.children

#### Defined in

[packages/matter.js/src/model/models/FabricModel.ts:23](https://github.com/project-chip/matter.js/blob/b7330d72/packages/matter.js/src/model/models/FabricModel.ts#L23)

___

### effectiveId

• `get` **effectiveId**(): `undefined` \| `number`

Allows subclasses to pull a working ID from an alternate source.

#### Returns

`undefined` \| `number`

#### Inherited from

Model.effectiveId

#### Defined in

[packages/matter.js/src/model/models/Model.ts:112](https://github.com/project-chip/matter.js/blob/b7330d72/packages/matter.js/src/model/models/Model.ts#L112)

___

### effectiveType

• `get` **effectiveType**(): `undefined` \| `string`

In some circumstances the base type can be inferred.  This inference
happens here.

Does not recurse so only returns the direct base type.

#### Returns

`undefined` \| `string`

#### Inherited from

Model.effectiveType

#### Defined in

[packages/matter.js/src/model/models/Model.ts:200](https://github.com/project-chip/matter.js/blob/b7330d72/packages/matter.js/src/model/models/Model.ts#L200)

___

### effectiveXref

• `get` **effectiveXref**(): `undefined` \| [`CrossReference`](model.Model.CrossReference.md)

A local or parent xref.

#### Returns

`undefined` \| [`CrossReference`](model.Model.CrossReference.md)

#### Inherited from

Model.effectiveXref

#### Defined in

[packages/matter.js/src/model/models/Model.ts:230](https://github.com/project-chip/matter.js/blob/b7330d72/packages/matter.js/src/model/models/Model.ts#L230)

___

### elements

• `get` **elements**(): [`AnyElement`](../modules/model.md#anyelement)[]

Element view of children.  For TypeScript this allows children to be
added as elements.  For JavaScript this is identical to children().

#### Returns

[`AnyElement`](../modules/model.md#anyelement)[]

#### Inherited from

Model.elements

#### Defined in

[packages/matter.js/src/model/models/Model.ts:102](https://github.com/project-chip/matter.js/blob/b7330d72/packages/matter.js/src/model/models/Model.ts#L102)

___

### globalBase

• `get` **globalBase**(): `undefined` \| [`Model`](model.Model-1.md)

Get the first global base type.  This may have semantic meaning more
specific than the base primitive type.

#### Returns

`undefined` \| [`Model`](model.Model-1.md)

#### Inherited from

Model.globalBase

#### Defined in

[packages/matter.js/src/model/models/Model.ts:223](https://github.com/project-chip/matter.js/blob/b7330d72/packages/matter.js/src/model/models/Model.ts#L223)

___

### key

• `get` **key**(): `undefined` \| `string`

Get a string that uniquely identifies this model.  This is normally
the effective ID but some models require a generated identifier.

#### Returns

`undefined` \| `string`

#### Inherited from

Model.key

#### Defined in

[packages/matter.js/src/model/models/Model.ts:120](https://github.com/project-chip/matter.js/blob/b7330d72/packages/matter.js/src/model/models/Model.ts#L120)

___

### nodes

• `get` **nodes**(): [`NodeModel`](model.NodeModel.md)[]

#### Returns

[`NodeModel`](model.NodeModel.md)[]

#### Defined in

[packages/matter.js/src/model/models/FabricModel.ts:15](https://github.com/project-chip/matter.js/blob/b7330d72/packages/matter.js/src/model/models/FabricModel.ts#L15)

___

### parent

• `get` **parent**(): `undefined` \| [`Model`](model.Model-1.md)

The structural parent.  This is the model for the element that contains
this element's definition.

#### Returns

`undefined` \| [`Model`](model.Model-1.md)

#### Inherited from

Model.parent

#### Defined in

[packages/matter.js/src/model/models/Model.ts:71](https://github.com/project-chip/matter.js/blob/b7330d72/packages/matter.js/src/model/models/Model.ts#L71)

• `set` **parent**(`parent`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `parent` | `undefined` \| [`Model`](model.Model-1.md) |

#### Returns

`void`

#### Inherited from

Model.parent

#### Defined in

[packages/matter.js/src/model/models/Model.ts:75](https://github.com/project-chip/matter.js/blob/b7330d72/packages/matter.js/src/model/models/Model.ts#L75)

___

### path

• `get` **path**(): `string`

The full path ("." delimited) in the Matter tree.

#### Returns

`string`

#### Inherited from

Model.path

#### Defined in

[packages/matter.js/src/model/models/Model.ts:59](https://github.com/project-chip/matter.js/blob/b7330d72/packages/matter.js/src/model/models/Model.ts#L59)

___

### shadow

• `get` **shadow**(): `undefined` \| [`Model`](model.Model-1.md)

Get shadow model, if any.  A "shadow" is an element in my parent's
inheritance hierarchy that I override.

#### Returns

`undefined` \| [`Model`](model.Model-1.md)

#### Inherited from

Model.shadow

#### Defined in

[packages/matter.js/src/model/models/Model.ts:215](https://github.com/project-chip/matter.js/blob/b7330d72/packages/matter.js/src/model/models/Model.ts#L215)

___

### valid

• `get` **valid**(): `boolean`

Did validation find errors?

#### Returns

`boolean`

#### Inherited from

Model.valid

#### Defined in

[packages/matter.js/src/model/models/Model.ts:52](https://github.com/project-chip/matter.js/blob/b7330d72/packages/matter.js/src/model/models/Model.ts#L52)

## Methods

### add

▸ **add**(`...children`): `void`

Add a child.  children.push works too but only accepts models.

#### Parameters

| Name | Type |
| :------ | :------ |
| `...children` | ([`AnyElement`](../modules/model.md#anyelement) \| [`Model`](model.Model-1.md))[] |

#### Returns

`void`

#### Inherited from

[Model](model.Model-1.md).[add](model.Model-1.md#add)

#### Defined in

[packages/matter.js/src/model/models/Model.ts:244](https://github.com/project-chip/matter.js/blob/b7330d72/packages/matter.js/src/model/models/Model.ts#L244)

___

### all

▸ **all**<`T`\>(`constructor`): `T`[]

Retrieve all models of a specific element type from local scope.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends [`Model`](model.Model-1.md) |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `constructor` | [`Constructor`](../modules/model.Model.md#constructor)<`T`\> | model class or a predicate object |

#### Returns

`T`[]

#### Inherited from

[Model](model.Model-1.md).[all](model.Model-1.md#all)

#### Defined in

[packages/matter.js/src/model/models/Model.ts:268](https://github.com/project-chip/matter.js/blob/b7330d72/packages/matter.js/src/model/models/Model.ts#L268)

___

### error

▸ **error**(`code`, `message`): `void`

Record a validation error for this model.

#### Parameters

| Name | Type |
| :------ | :------ |
| `code` | `string` |
| `message` | `string` |

#### Returns

`void`

#### Inherited from

[Model](model.Model-1.md).[error](model.Model-1.md#error)

#### Defined in

[packages/matter.js/src/model/models/Model.ts:303](https://github.com/project-chip/matter.js/blob/b7330d72/packages/matter.js/src/model/models/Model.ts#L303)

___

### get

▸ **get**<`T`\>(`constructor`, `key`): `T`

Retrieve a specific model by ID or name.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends [`Model`](model.Model-1.md) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `constructor` | [`Constructor`](../modules/model.Model.md#constructor)<`T`\> |
| `key` | `string` \| `number` |

#### Returns

`T`

#### Inherited from

[Model](model.Model-1.md).[get](model.Model-1.md#get)

#### Defined in

[packages/matter.js/src/model/models/Model.ts:275](https://github.com/project-chip/matter.js/blob/b7330d72/packages/matter.js/src/model/models/Model.ts#L275)

___

### instanceOf

▸ **instanceOf**(`other`): `boolean`

Does this model derive from another?

#### Parameters

| Name | Type |
| :------ | :------ |
| `other` | [`AnyElement`](../modules/model.md#anyelement) \| [`Model`](model.Model-1.md) |

#### Returns

`boolean`

#### Inherited from

[Model](model.Model-1.md).[instanceOf](model.Model-1.md#instanceof)

#### Defined in

[packages/matter.js/src/model/models/Model.ts:373](https://github.com/project-chip/matter.js/blob/b7330d72/packages/matter.js/src/model/models/Model.ts#L373)

___

### is

▸ **is**(`key`): `boolean`

Check identity of element by name or ID.

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `undefined` \| [`ElementSelector`](../modules/export._internal_.ModelTraversal.md#elementselector) |

#### Returns

`boolean`

#### Inherited from

[Model](model.Model-1.md).[is](model.Model-1.md#is)

#### Defined in

[packages/matter.js/src/model/models/Model.ts:291](https://github.com/project-chip/matter.js/blob/b7330d72/packages/matter.js/src/model/models/Model.ts#L291)

___

### member

▸ **member**(`key`, `allowedTags?`): `undefined` \| [`Model`](model.Model-1.md)

Search the inheritance chain for a child property.

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | [`ElementSelector`](../modules/export._internal_.ModelTraversal.md#elementselector) |
| `allowedTags` | [`ElementTag`](../enums/model.ElementTag.md)[] |

#### Returns

`undefined` \| [`Model`](model.Model-1.md)

#### Inherited from

[Model](model.Model-1.md).[member](model.Model-1.md#member)

#### Defined in

[packages/matter.js/src/model/models/Model.ts:363](https://github.com/project-chip/matter.js/blob/b7330d72/packages/matter.js/src/model/models/Model.ts#L363)

___

### owner

▸ **owner**<`T`\>(`constructor`): `undefined` \| `T`

Retrieve a model of a specific type from the ownership hierarchy.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends [`Model`](model.Model-1.md) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `constructor` | [`Constructor`](../modules/model.Model.md#constructor)<`T`\> |

#### Returns

`undefined` \| `T`

#### Inherited from

[Model](model.Model-1.md).[owner](model.Model-1.md#owner)

#### Defined in

[packages/matter.js/src/model/models/Model.ts:284](https://github.com/project-chip/matter.js/blob/b7330d72/packages/matter.js/src/model/models/Model.ts#L284)

___

### references

▸ **references**(`type`): [`Model`](model.Model-1.md)[]

Find all children that reference a specific type.

#### Parameters

| Name | Type |
| :------ | :------ |
| `type` | [`Model`](model.Model-1.md) |

#### Returns

[`Model`](model.Model-1.md)[]

#### Inherited from

[Model](model.Model-1.md).[references](model.Model-1.md#references)

#### Defined in

[packages/matter.js/src/model/models/Model.ts:356](https://github.com/project-chip/matter.js/blob/b7330d72/packages/matter.js/src/model/models/Model.ts#L356)

___

### toJSON

▸ **toJSON**(): [`AnyElement`](../modules/model.md#anyelement)

Convert model to JSON.

#### Returns

[`AnyElement`](../modules/model.md#anyelement)

#### Inherited from

[Model](model.Model-1.md).[toJSON](model.Model-1.md#tojson)

#### Defined in

[packages/matter.js/src/model/models/Model.ts:319](https://github.com/project-chip/matter.js/blob/b7330d72/packages/matter.js/src/model/models/Model.ts#L319)

___

### valueOf

▸ **valueOf**(): [`AnyElement`](../modules/model.md#anyelement)

Convert to non-class structure.

#### Returns

[`AnyElement`](../modules/model.md#anyelement)

#### Inherited from

[Model](model.Model-1.md).[valueOf](model.Model-1.md#valueof)

#### Defined in

[packages/matter.js/src/model/models/Model.ts:326](https://github.com/project-chip/matter.js/blob/b7330d72/packages/matter.js/src/model/models/Model.ts#L326)

___

### visit

▸ **visit**(`visitor`): `undefined` \| `boolean`

Apply a function to all tree elements.

#### Parameters

| Name | Type |
| :------ | :------ |
| `visitor` | (`model`: [`Model`](model.Model-1.md)) => `boolean` \| `void` |

#### Returns

`undefined` \| `boolean`

#### Inherited from

[Model](model.Model-1.md).[visit](model.Model-1.md#visit)

#### Defined in

[packages/matter.js/src/model/models/Model.ts:349](https://github.com/project-chip/matter.js/blob/b7330d72/packages/matter.js/src/model/models/Model.ts#L349)

___

### create

▸ `Static` **create**(`definition`): [`Model`](model.Model-1.md)

Create a model for an element.

#### Parameters

| Name | Type |
| :------ | :------ |
| `definition` | [`AnyElement`](../modules/model.md#anyelement) |

#### Returns

[`Model`](model.Model-1.md)

#### Inherited from

[Model](model.Model-1.md).[create](model.Model-1.md#create)

#### Defined in

[packages/matter.js/src/model/models/Model.ts:251](https://github.com/project-chip/matter.js/blob/b7330d72/packages/matter.js/src/model/models/Model.ts#L251)

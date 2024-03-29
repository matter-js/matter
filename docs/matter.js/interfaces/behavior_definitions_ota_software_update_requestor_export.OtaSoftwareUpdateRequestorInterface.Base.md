[@project-chip/matter.js](../README.md) / [Modules](../modules.md) / [behavior/definitions/ota-software-update-requestor/export](../modules/behavior_definitions_ota_software_update_requestor_export.md) / [OtaSoftwareUpdateRequestorInterface](../modules/behavior_definitions_ota_software_update_requestor_export.OtaSoftwareUpdateRequestorInterface.md) / Base

# Interface: Base

[behavior/definitions/ota-software-update-requestor/export](../modules/behavior_definitions_ota_software_update_requestor_export.md).[OtaSoftwareUpdateRequestorInterface](../modules/behavior_definitions_ota_software_update_requestor_export.OtaSoftwareUpdateRequestorInterface.md).Base

## Table of contents

### Methods

- [announceOtaProvider](behavior_definitions_ota_software_update_requestor_export.OtaSoftwareUpdateRequestorInterface.Base.md#announceotaprovider)

## Methods

### announceOtaProvider

▸ **announceOtaProvider**(`request`): [`MaybePromise`](../modules/util_export.md#maybepromise)

This command may be invoked by Administrators to announce the presence of a particular OTA Provider.

This command shall be scoped to the accessing fabric.

If the accessing fabric index is 0, this command shall fail with an UNSUPPORTED_ACCESS status code.

This field shall contain the Node ID of a Node implementing the OTA Provider cluster server, on the
accessing fabric.

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`TypeFromFields`](../modules/tlv_export.md#typefromfields)\<\{ `announcementReason`: [`FieldType`](tlv_export.FieldType.md)\<[`AnnouncementReason`](../enums/cluster_export.OtaSoftwareUpdateRequestor.AnnouncementReason.md)\> ; `endpoint`: [`FieldType`](tlv_export.FieldType.md)\<[`EndpointNumber`](../modules/datatype_export.md#endpointnumber)\> ; `fabricIndex`: [`FieldType`](tlv_export.FieldType.md)\<[`FabricIndex`](../modules/datatype_export.md#fabricindex)\> ; `metadataForNode`: [`OptionalFieldType`](tlv_export.OptionalFieldType.md)\<`Uint8Array`\> ; `providerNodeId`: [`FieldType`](tlv_export.FieldType.md)\<[`NodeId`](../modules/datatype_export.md#nodeid)\> ; `vendorId`: [`FieldType`](tlv_export.FieldType.md)\<[`VendorId`](../modules/datatype_export.md#vendorid)\>  }\> |

#### Returns

[`MaybePromise`](../modules/util_export.md#maybepromise)

**`See`**

[MatterCoreSpecificationV1_1](spec_export.MatterCoreSpecificationV1_1.md) § 11.19.7.6.1

#### Defined in

[packages/matter.js/src/behavior/definitions/ota-software-update-requestor/OtaSoftwareUpdateRequestorInterface.ts:41](https://github.com/project-chip/matter.js/blob/3adaded6/packages/matter.js/src/behavior/definitions/ota-software-update-requestor/OtaSoftwareUpdateRequestorInterface.ts#L41)

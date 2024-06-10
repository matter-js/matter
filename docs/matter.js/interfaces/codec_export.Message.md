[@project-chip/matter.js](../README.md) / [Modules](../modules.md) / [codec/export](../modules/codec_export.md) / Message

# Interface: Message

[codec/export](../modules/codec_export.md).Message

## Hierarchy

- **`Message`**

  ↳ [`DecodedMessage`](codec_export.DecodedMessage.md)

## Table of contents

### Properties

- [packetHeader](codec_export.Message.md#packetheader)
- [payload](codec_export.Message.md#payload)
- [payloadHeader](codec_export.Message.md#payloadheader)
- [securityExtension](codec_export.Message.md#securityextension)

## Properties

### packetHeader

• **packetHeader**: [`PacketHeader`](codec_export.PacketHeader.md)

#### Defined in

[packages/matter.js/src/codec/MessageCodec.ts:54](https://github.com/project-chip/matter.js/blob/5f71eedebdb9fa54338bde320c311bb359b7455d/packages/matter.js/src/codec/MessageCodec.ts#L54)

___

### payload

• **payload**: `Uint8Array`

#### Defined in

[packages/matter.js/src/codec/MessageCodec.ts:57](https://github.com/project-chip/matter.js/blob/5f71eedebdb9fa54338bde320c311bb359b7455d/packages/matter.js/src/codec/MessageCodec.ts#L57)

___

### payloadHeader

• **payloadHeader**: [`PayloadHeader`](codec_export.PayloadHeader.md)

#### Defined in

[packages/matter.js/src/codec/MessageCodec.ts:55](https://github.com/project-chip/matter.js/blob/5f71eedebdb9fa54338bde320c311bb359b7455d/packages/matter.js/src/codec/MessageCodec.ts#L55)

___

### securityExtension

• `Optional` **securityExtension**: `Uint8Array`

#### Defined in

[packages/matter.js/src/codec/MessageCodec.ts:56](https://github.com/project-chip/matter.js/blob/5f71eedebdb9fa54338bde320c311bb359b7455d/packages/matter.js/src/codec/MessageCodec.ts#L56)

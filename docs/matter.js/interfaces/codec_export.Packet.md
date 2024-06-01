[@project-chip/matter.js](../README.md) / [Modules](../modules.md) / [codec/export](../modules/codec_export.md) / Packet

# Interface: Packet

[codec/export](../modules/codec_export.md).Packet

## Hierarchy

- **`Packet`**

  ↳ [`DecodedPacket`](codec_export.DecodedPacket.md)

## Table of contents

### Properties

- [applicationPayload](codec_export.Packet.md#applicationpayload)
- [header](codec_export.Packet.md#header)
- [messageExtension](codec_export.Packet.md#messageextension)

## Properties

### applicationPayload

• **applicationPayload**: `Uint8Array`

#### Defined in

[packages/matter.js/src/codec/MessageCodec.ts:47](https://github.com/project-chip/matter.js/blob/5f71eedebdb9fa54338bde320c311bb359b7455d/packages/matter.js/src/codec/MessageCodec.ts#L47)

___

### header

• **header**: [`PacketHeader`](codec_export.PacketHeader.md)

#### Defined in

[packages/matter.js/src/codec/MessageCodec.ts:45](https://github.com/project-chip/matter.js/blob/5f71eedebdb9fa54338bde320c311bb359b7455d/packages/matter.js/src/codec/MessageCodec.ts#L45)

___

### messageExtension

• `Optional` **messageExtension**: `Uint8Array`

#### Defined in

[packages/matter.js/src/codec/MessageCodec.ts:46](https://github.com/project-chip/matter.js/blob/5f71eedebdb9fa54338bde320c311bb359b7455d/packages/matter.js/src/codec/MessageCodec.ts#L46)

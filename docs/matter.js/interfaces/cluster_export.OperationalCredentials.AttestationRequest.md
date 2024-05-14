[@project-chip/matter.js](../README.md) / [Modules](../modules.md) / [cluster/export](../modules/cluster_export.md) / [OperationalCredentials](../modules/cluster_export.OperationalCredentials.md) / AttestationRequest

# Interface: AttestationRequest

[cluster/export](../modules/cluster_export.md).[OperationalCredentials](../modules/cluster_export.OperationalCredentials.md).AttestationRequest

Input to the OperationalCredentials attestationRequest command

**`See`**

MatterSpecification.v11.Core § 11.17.6.1

## Hierarchy

- [`TypeFromSchema`](../modules/tlv_export.md#typefromschema)\<typeof [`TlvAttestationRequest`](../modules/cluster_export.OperationalCredentials.md#tlvattestationrequest)\>

  ↳ **`AttestationRequest`**

## Table of contents

### Properties

- [attestationNonce](cluster_export.OperationalCredentials.AttestationRequest.md#attestationnonce)

## Properties

### attestationNonce

• **attestationNonce**: `Uint8Array`

#### Inherited from

TypeFromSchema.attestationNonce

#### Defined in

[packages/matter.js/src/cluster/definitions/OperationalCredentialsCluster.ts:141](https://github.com/project-chip/matter.js/blob/558e12c94a201592c28c7bc0743705360b3e5ca6/packages/matter.js/src/cluster/definitions/OperationalCredentialsCluster.ts#L141)

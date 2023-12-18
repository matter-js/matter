[@project-chip/matter-node.js](../README.md) / [Modules](../modules.md) / [exports/cluster](exports_cluster.md) / LeafWetnessMeasurement

# Namespace: LeafWetnessMeasurement

[exports/cluster](exports_cluster.md).LeafWetnessMeasurement

## Table of contents

### Variables

- [Cluster](exports_cluster.LeafWetnessMeasurement.md#cluster)

## Variables

### Cluster

• `Const` **Cluster**: [`Definition`](exports_cluster.ClusterFactory.md#definition)\<\{ `attributes`: \{ `maxMeasuredValue`: [`Attribute`](exports_cluster.md#attribute)\<`number` \| ``null``, `any`\> ; `measuredValue`: [`Attribute`](exports_cluster.md#attribute)\<`number` \| ``null``, `any`\> ; `minMeasuredValue`: [`Attribute`](exports_cluster.md#attribute)\<`number` \| ``null``, `any`\> ; `tolerance`: [`OptionalAttribute`](exports_cluster.md#optionalattribute)\<`number`, `any`\>  } ; `id`: ``1031`` ; `name`: ``"LeafWetnessMeasurement"`` ; `revision`: ``3``  }\>

This is a base cluster. The server cluster provides an interface to water content measurement functionality. The
measurement is reportable and may be configured for reporting. Water content measurements include, but are not
limited to, leaf wetness, relative humidity, and soil moisture.

**`See`**

MatterApplicationClusterSpecificationV1_1 § 2.6

#### Defined in

packages/matter.js/dist/esm/cluster/definitions/LeafWetnessMeasurementCluster.d.ts:17

[@project-chip/matter.js](../README.md) / [Modules](../modules.md) / [cluster/export](cluster_export.md) / RelativeHumidityMeasurement

# Namespace: RelativeHumidityMeasurement

[cluster/export](cluster_export.md).RelativeHumidityMeasurement

## Table of contents

### Variables

- [Cluster](cluster_export.RelativeHumidityMeasurement.md#cluster)

## Variables

### Cluster

• `Const` **Cluster**: [`Definition`](cluster_export.ClusterFactory.md#definition)<{ `attributes`: { `maxMeasuredValue`: [`Attribute`](cluster_export.md#attribute)<``null`` \| `number`, `any`\> ; `measuredValue`: [`Attribute`](cluster_export.md#attribute)<``null`` \| `number`, `any`\> ; `minMeasuredValue`: [`Attribute`](cluster_export.md#attribute)<``null`` \| `number`, `any`\> ; `tolerance`: [`OptionalAttribute`](cluster_export.md#optionalattribute)<`number`, `any`\>  } ; `id`: ``1029`` = 0x405; `name`: ``"RelativeHumidityMeasurement"`` = "RelativeHumidityMeasurement"; `revision`: ``3`` = 3 }\>

Relative Humidity Measurement

This is a base cluster. The server cluster provides an interface to water content measurement functionality. The
measurement is reportable and may be configured for reporting. Water content measurements include, but are not
limited to, leaf wetness, relative humidity, and soil moisture.

**`See`**

[MatterApplicationClusterSpecificationV1_1](../interfaces/spec_export.MatterApplicationClusterSpecificationV1_1.md) § 2.6

#### Defined in

[packages/matter.js/src/cluster/definitions/RelativeHumidityMeasurementCluster.ts:25](https://github.com/project-chip/matter.js/blob/ac2c2688/packages/matter.js/src/cluster/definitions/RelativeHumidityMeasurementCluster.ts#L25)

/**
 * @license
 * Copyright 2022-2023 Project CHIP Authors
 * SPDX-License-Identifier: Apache-2.0
 */

/*** THIS FILE IS GENERATED, DO NOT EDIT ***/

import { MatterApplicationClusterSpecificationV1_1 } from "../../spec/Specifications.js";
import { BaseClusterComponent, ClusterComponent, ExtensibleCluster, validateFeatureSelection, ClusterForBaseCluster } from "../../cluster/ClusterFactory.js";
import { BitFlag, BitFlags, TypeFromPartialBitSchema } from "../../schema/BitmapSchema.js";
import { Attribute, Command, TlvNoResponse, Cluster } from "../../cluster/Cluster.js";
import { TlvArray } from "../../tlv/TlvArray.js";
import { TlvObject, TlvField } from "../../tlv/TlvObject.js";
import { TlvUInt8, TlvEnum } from "../../tlv/TlvNumber.js";
import { TlvString } from "../../tlv/TlvString.js";

/**
 * The type of output, expressed as an enum, with the following values:
 *
 * @see {@link MatterApplicationClusterSpecificationV1_1} § 6.5.5.2
 */
export const enum OutputType {
    /**
     * HDMI
     */
    Hdmi = 0,

    Bt = 1,
    Optical = 2,
    Headphone = 3,
    Internal = 4,
    Other = 5
}

/**
 * This contains information about an output.
 *
 * @see {@link MatterApplicationClusterSpecificationV1_1} § 6.5.5.1
 */
export const TlvOutputInfoStruct = TlvObject({
    /**
     * This shall indicate the unique index into the list of outputs.
     *
     * @see {@link MatterApplicationClusterSpecificationV1_1} § 6.5.5.1.1
     */
    index: TlvField(0, TlvUInt8),

    /**
     * This shall indicate the type of output
     *
     * @see {@link MatterApplicationClusterSpecificationV1_1} § 6.5.5.1.2
     */
    outputType: TlvField(1, TlvEnum<OutputType>()),

    /**
     * The device defined and user editable output name, such as “Soundbar”, “Speakers”. This field may be blank, but
     * SHOULD be provided when known.
     *
     * @see {@link MatterApplicationClusterSpecificationV1_1} § 6.5.5.1.3
     */
    name: TlvField(2, TlvString.bound({ maxLength: 32 }))
});

/**
 * Input to the AudioOutput selectOutput command
 *
 * @see {@link MatterApplicationClusterSpecificationV1_1} § 6.5.4
 */
export const TlvSelectOutputRequest = TlvObject({ index: TlvField(0, TlvUInt8) });

/**
 * Input to the AudioOutput renameOutput command
 *
 * @see {@link MatterApplicationClusterSpecificationV1_1} § 6.5.4.2
 */
export const TlvRenameOutputRequest = TlvObject({ index: TlvField(0, TlvUInt8), name: TlvField(1, TlvString) });

/**
 * These are optional features supported by AudioOutputCluster.
 *
 * @see {@link MatterApplicationClusterSpecificationV1_1} § 6.5.2
 */
export enum AudioOutputFeature {
    /**
     * NameUpdates
     *
     * Supports updates to output names
     */
    NameUpdates = "NameUpdates"
}

/**
 * These elements and properties are present in all AudioOutput clusters.
 */
export const AudioOutputBase = BaseClusterComponent({
    id: 0x50b,
    name: "AudioOutput",
    revision: 1,

    features: {
        /**
         * NameUpdates
         *
         * Supports updates to output names
         */
        nameUpdates: BitFlag(0)
    },

    attributes: {
        /**
         * This list provides the outputs supported by the device.
         *
         * @see {@link MatterApplicationClusterSpecificationV1_1} § 6.5.3.1
         */
        outputList: Attribute(0x0, TlvArray(TlvOutputInfoStruct)),

        /**
         * This field contains the value of the index field of the currently selected OutputInfoStruct.
         *
         * @see {@link MatterApplicationClusterSpecificationV1_1} § 6.5.3.2
         */
        currentOutput: Attribute(0x1, TlvUInt8, { default: 0 })
    },

    commands: {
        /**
         * @see {@link MatterApplicationClusterSpecificationV1_1} § 6.5.4
         */
        selectOutput: Command(0x0, TlvSelectOutputRequest, 0x0, TlvNoResponse)
    }
});

/**
 * A AudioOutputCluster supports these elements if it supports feature NameUpdates.
 */
export const NameUpdatesComponent = ClusterComponent({
    commands: {
        /**
         * Upon receipt, this shall rename the output at a specific index in the Output List.
         *
         * Updates to the output name shall appear in the device’s settings menus. Name updates may automatically be
         * sent to the actual device to which the output connects.
         *
         * @see {@link MatterApplicationClusterSpecificationV1_1} § 6.5.4.2
         */
        renameOutput: Command(0x1, TlvRenameOutputRequest, 0x1, TlvNoResponse)
    }
});

/**
 * Audio Output
 *
 * This cluster provides an interface for controlling the Output on a Video Player device such as a TV.
 *
 * AudioOutputCluster supports optional features that you can enable with the AudioOutputCluster.with() factory method.
 *
 * @see {@link MatterApplicationClusterSpecificationV1_1} § 6.5
 */
export const AudioOutputCluster = ExtensibleCluster({
    ...AudioOutputBase,

    /**
     * Use this factory method to create an AudioOutput cluster with support for optional features. Include each
     * {@link AudioOutputFeature} you wish to support.
     *
     * @param features the optional features to support
     * @returns an AudioOutput cluster with specified features enabled
     * @throws {IllegalClusterError} if the feature combination is disallowed by the Matter specification
     */
    factory: <T extends `${AudioOutputFeature}`[]>(...features: [...T]) => {
        validateFeatureSelection(features, AudioOutputFeature);
        const cluster = Cluster({ ...AudioOutputBase, supportedFeatures: BitFlags(AudioOutputBase.features, ...features) });
        return cluster as unknown as AudioOutputExtension<BitFlags<typeof AudioOutputBase.features, T>>;
    }
});

export type AudioOutputExtension<SF extends TypeFromPartialBitSchema<typeof AudioOutputBase.features>> =
    ClusterForBaseCluster<typeof AudioOutputBase, SF>
    & { supportedFeatures: SF }
    & (SF extends { nameUpdates: true } ? typeof NameUpdatesComponent : {});

/**
 * This cluster supports all AudioOutput features. It may support illegal feature combinations.
 *
 * If you use this cluster you must manually specify which features are active and ensure the set of active features is
 * legal per the Matter specification.
 */
export const AudioOutputComplete = Cluster({ ...AudioOutputCluster, commands: { ...NameUpdatesComponent.commands } });

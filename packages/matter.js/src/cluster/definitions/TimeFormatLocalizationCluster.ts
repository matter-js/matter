/**
 * @license
 * Copyright 2022-2023 Project CHIP Authors
 * SPDX-License-Identifier: Apache-2.0
 */

/*** THIS FILE IS GENERATED, DO NOT EDIT ***/

import { MatterCoreSpecificationV1_1 } from "../../spec/Specifications.js";
import { BaseClusterComponent, ClusterComponent, ExtensibleCluster, validateFeatureSelection, ClusterForBaseCluster } from "../../cluster/ClusterFactory.js";
import { BitFlag, BitFlags, TypeFromPartialBitSchema } from "../../schema/BitmapSchema.js";
import { WritableAttribute, AccessLevel, FixedAttribute, Cluster } from "../../cluster/Cluster.js";
import { TlvEnum } from "../../tlv/TlvNumber.js";
import { TlvNullable } from "../../tlv/TlvNullable.js";
import { TlvArray } from "../../tlv/TlvArray.js";

/**
 * @see {@link MatterCoreSpecificationV1_1} § 11.4.5.1
 */
export const enum HourFormat {
    /**
     * Time conveyed with a 12-hour clock
     */
    "12Hr" = 0,

    /**
     * Time conveyed with a 24-hour clock
     */
    "24Hr" = 1
}

/**
 * @see {@link MatterCoreSpecificationV1_1} § 11.4.5.2
 */
export const enum CalendarType {
    /**
     * Dates conveyed using the Buddhist calendar
     */
    Buddhist = 0,

    /**
     * Dates conveyed using the Chinese calendar
     */
    Chinese = 1,

    /**
     * Dates conveyed using the Coptic calendar
     */
    Coptic = 2,

    /**
     * Dates conveyed using the Ethiopian calendar
     */
    Ethiopian = 3,

    /**
     * Dates conveyed using the Gregorian calendar
     */
    Gregorian = 4,

    /**
     * Dates conveyed using the Hebrew calendar
     */
    Hebrew = 5,

    /**
     * Dates conveyed using the Indian calendar
     */
    Indian = 6,

    /**
     * Dates conveyed using the Islamic calendar
     */
    Islamic = 7,

    /**
     * Dates conveyed using the Japanese calendar
     */
    Japanese = 8,

    /**
     * Dates conveyed using the Korean calendar
     */
    Korean = 9,

    /**
     * Dates conveyed using the Persian calendar
     */
    Persian = 10,

    /**
     * Dates conveyed using the Taiwanese calendar
     */
    Taiwanese = 11
}

/**
 * These are optional features supported by TimeFormatLocalizationCluster.
 *
 * @see {@link MatterCoreSpecificationV1_1} § 11.4.4
 */
export enum TimeFormatLocalizationFeature {
    /**
     * CalendarFormat
     *
     * The Node can be configured to use different calendar formats when conveying values to a user.
     */
    CalendarFormat = "CalendarFormat"
}

/**
 * These elements and properties are present in all TimeFormatLocalization clusters.
 */
export const TimeFormatLocalizationBase = BaseClusterComponent({
    id: 0x2c,
    name: "TimeFormatLocalization",
    revision: 1,

    features: {
        /**
         * CalendarFormat
         *
         * The Node can be configured to use different calendar formats when conveying values to a user.
         */
        calendarFormat: BitFlag(0)
    },

    attributes: {
        /**
         * The HourFormat attribute shall represent the format that the Node is currently configured to use when
         * conveying the hour unit of time. If provided, this value shall take priority over any unit
         *
         * implied through the ActiveLocale Attribute.
         *
         * @see {@link MatterCoreSpecificationV1_1} § 11.4.6.1
         */
        hourFormat: WritableAttribute(
            0x0,
            TlvNullable(TlvEnum<HourFormat>()),
            { persistent: true, default: null, writeAcl: AccessLevel.Manage }
        )
    }
});

/**
 * A TimeFormatLocalizationCluster supports these elements if it supports feature CalendarFormat.
 */
export const CalendarFormatComponent = ClusterComponent({
    attributes: {
        /**
         * The ActiveCalendarType attribute shall represent the calendar format that the Node is currently configured
         * to use when conveying dates. If provided, this value shall take priority over any unit implied through the
         * ActiveLocale Attribute.
         *
         * @see {@link MatterCoreSpecificationV1_1} § 11.4.6.2
         */
        activeCalendarType: WritableAttribute(
            0x1,
            TlvNullable(TlvEnum<CalendarType>()),
            { persistent: true, default: null, writeAcl: AccessLevel.Manage }
        ),

        /**
         * The SupportedCalendarTypes attribute shall represent a list of CalendarTypeEnum values that are supported by
         * the Node. The list shall NOT contain any duplicate entries. The ordering of items within the list SHOULD NOT
         * express any meaning. The maximum length of the SupportedCalendarTypes list shall be equivalent to the number
         * of enumerations within CalendarTypeEnum.
         *
         * @see {@link MatterCoreSpecificationV1_1} § 11.4.6.3
         */
        supportedCalendarTypes: FixedAttribute(0x2, TlvArray(TlvEnum<CalendarType>()), { default: [] })
    }
});

/**
 * Time Format Localization
 *
 * Nodes should be expected to be deployed to any and all regions of the world. These global regions may have differing
 * preferences for how dates and times are conveyed. As such, Nodes that visually or audibly convey time information
 * need a mechanism by which they can be configured to use a user’s preferred format.
 *
 * This cluster supports an interface to a Node. It provides attributes for determining and configuring time and date
 * formatting information that a Node shall utilize when conveying values to a user.
 *
 * TimeFormatLocalizationCluster supports optional features that you can enable with the
 * TimeFormatLocalizationCluster.with() factory method.
 *
 * @see {@link MatterCoreSpecificationV1_1} § 11.4
 */
export const TimeFormatLocalizationCluster = ExtensibleCluster({
    ...TimeFormatLocalizationBase,

    /**
     * Use this factory method to create a TimeFormatLocalization cluster with support for optional features. Include
     * each {@link TimeFormatLocalizationFeature} you wish to support.
     *
     * @param features the optional features to support
     * @returns a TimeFormatLocalization cluster with specified features enabled
     * @throws {IllegalClusterError} if the feature combination is disallowed by the Matter specification
     */
    factory: <T extends `${TimeFormatLocalizationFeature}`[]>(...features: [...T]) => {
        validateFeatureSelection(features, TimeFormatLocalizationFeature);
        const cluster = Cluster({
            ...TimeFormatLocalizationBase,
            supportedFeatures: BitFlags(TimeFormatLocalizationBase.features, ...features)
        });
        return cluster as unknown as TimeFormatLocalizationExtension<BitFlags<typeof TimeFormatLocalizationBase.features, T>>;
    }
});

export type TimeFormatLocalizationExtension<SF extends TypeFromPartialBitSchema<typeof TimeFormatLocalizationBase.features>> =
    ClusterForBaseCluster<typeof TimeFormatLocalizationBase, SF>
    & { supportedFeatures: SF }
    & (SF extends { calendarFormat: true } ? typeof CalendarFormatComponent : {});

/**
 * This cluster supports all TimeFormatLocalization features. It may support illegal feature combinations.
 *
 * If you use this cluster you must manually specify which features are active and ensure the set of active features is
 * legal per the Matter specification.
 */
export const TimeFormatLocalizationComplete = Cluster({
    ...TimeFormatLocalizationCluster,
    attributes: { ...CalendarFormatComponent.attributes }
});

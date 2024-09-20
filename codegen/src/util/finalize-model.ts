/**
 * @license
 * Copyright 2022-2024 Matter.js Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { isDeepEqual, Logger } from "#general";
import {
    AnyElement,
    AttributeModel,
    ClusterModel,
    CommandModel,
    DatatypeModel,
    FieldModel,
    MatterModel,
    Metatype,
    Model,
    status as statusType,
    ValidateModel,
    ValueModel,
} from "#model";

const logger = Logger.get("create-model");

/**
 * Get the properties of children without xrefs so we can compare types using isDeepEqual
 */
function childrenIdentity(model: ValueModel) {
    return model.children.map(child => {
        const properties = child.valueOf();
        delete properties.xref;
        delete (properties as any).conformance;
        return properties;
    });
}

/**
 * Some enum definitions are left hanging that we can fix with a quick scan comparing names.  I believe this only
 * affects enums in ColorControlCluster from the spec but the logic is generic and safe so applying to all clusters
 */
function patchClusterTypes(cluster: ClusterModel) {
    // First gather existing datatypes so we treat them as canonical
    const datatypes = {} as { [name: string]: ValueModel };
    cluster.datatypes.forEach(datatype => (datatypes[datatype.name] = datatype));

    // Now add any element that may be promoted to a datatype
    cluster.visit(model => {
        if (model instanceof ValueModel && model.children.length) {
            switch (model.effectiveMetatype) {
                case Metatype.enum:
                case Metatype.object:
                case Metatype.bitmap:
                    break;

                default:
                    return;
            }

            const existing = datatypes[model.name];
            if (!existing || (existing.parent !== cluster && model.parent === cluster)) {
                datatypes[model.name] = model;
            }
        }
    });

    // Update the type for datatypes that a.) share the name but do not have children, or b.) duplicate this datatype
    const promote = new Set<ValueModel>();
    cluster.visit(model => {
        if (!(model instanceof ValueModel)) {
            return;
        }

        if (model.name === "Status" && model.type === "uint8") {
            model.type = "status";
            return;
        }

        const datatype = datatypes[model.name];
        if (!datatype || datatype === model) {
            return;
        }

        const metabase = datatype.metabase;
        if (!metabase || model.metabase !== metabase) {
            return;
        }

        if (model.children.length) {
            if (isDeepEqual(childrenIdentity(datatype), childrenIdentity(model))) {
                model.type = datatype.name;
                model.children = [];
                promote.add(datatype);
            }
        } else if (model.type === undefined || model.type.startsWith("enum")) {
            model.type = datatype.name;
            promote.add(datatype);
        }
    });

    // Ensure that any referenced datatypes are top-level named datatypes
    promote.forEach(model => {
        if (model.parent === cluster) {
            return;
        }

        if (model.owner(ClusterModel) !== cluster) {
            return;
        }

        cluster.children.push(
            new DatatypeModel({
                name: model.name,
                type: model.type,
                xref: model.xref,
                children: model.children,
            }),
        );

        model.type = model.name;
    });
}

/**
 * The optionsMask/OptionsOverrides pattern defined by LevelControl is used by a number of clusters.  These usually
 * specify their type as "map8" rather than the appropriate type.  This function fixes this.
 */
function patchOptionsTypes(cluster: ClusterModel) {
    for (const element of cluster.children) {
        if (!(element instanceof CommandModel)) {
            continue;
        }

        if (!cluster.get(AttributeModel, "Options")) {
            return;
        }

        const mask = element.get(FieldModel, "OptionsMask");
        if (mask) {
            mask.type = "Options";
        }
        const overrides = element.get(FieldModel, "OptionsOverride");
        if (overrides) {
            overrides.type = "Options";
        }
    }
}

/**
 * Dangling enum8s called "Status" are status codes.
 */
function patchStatusTypes(cluster: ClusterModel) {
    for (const element of cluster.children) {
        if (!(element instanceof CommandModel)) {
            continue;
        }

        const status = element.get(FieldModel, "Status");
        if (!status || status.type !== "enum8") {
            continue;
        }

        const defining = status.definingModel;
        if (defining) {
            continue;
        }

        status.type = statusType.name;
    }
}

function isZigbee(model: Model, zigbeeFeatures?: string[]) {
    const conformance = (model as { conformance?: unknown }).conformance?.toString();
    if (conformance === undefined) {
        return;
    }
    if (conformance.match(/\[?[Zz]igbee\]?(?:, D)?/)) {
        return true;
    }

    if (zigbeeFeatures === undefined) {
        return;
    }
    for (const feature of zigbeeFeatures) {
        if (conformance === feature || conformance === `[${feature}]`) {
            return true;
        }
    }
}

/**
 * Eject any element that is zigbee-only.
 *
 * The spec randomly litters elements with the undocumented conformance name "Zigbee".  Assuming this indicates the
 * element is zigbee-only (so, not sure why it is in Matter specification) we do not want it.
 *
 * If an element doesn't mention Zigbee directly it may still be Zigbee if it's dependent on a feature that is
 * Zigbee-only.  So we get rid of these too.  HOWEVER the only place this occurs as of 1.3 is the thermostat SCH
 * features which is marked deprecated too.  We override back to O until we get confirmation to this question:
 *
 *   https://github.com/espressif/esp-matter/issues/923#issuecomment-2105989691
 *
 * ...so the feature components of this code are unnecessary.  Leaving as is for now though.
 */
function ejectZigbee(model: Model, zigbeeFeatures?: string[]) {
    if (model instanceof ClusterModel) {
        for (const feature of model.features) {
            if (isZigbee(feature)) {
                if (!zigbeeFeatures) {
                    zigbeeFeatures = [feature.name];
                } else {
                    zigbeeFeatures.push(feature.name);
                }
            }
        }
    }

    const filtered = [] as Model[];
    for (const child of model.children) {
        if (isZigbee(child, zigbeeFeatures)) {
            continue;
        }
        filtered.push(child);
        ejectZigbee(child, zigbeeFeatures);
    }
    if (filtered.length !== model.children.length) {
        model.children = filtered as AnyElement[];
    }
}

/**
 * Create and validate the final model for export
 **/
export function finalizeModel(matter: MatterModel) {
    matter.children.forEach(c => {
        if (c instanceof ClusterModel) {
            patchClusterTypes(c);
            patchOptionsTypes(c);
            patchStatusTypes(c);
        }
    });

    ejectZigbee(matter);

    logger.info(`validate ${matter.name}`);

    return Logger.nest(() => {
        return ValidateModel(matter);
    });
}

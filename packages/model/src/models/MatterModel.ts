/**
 * @license
 * Copyright 2022-2024 Matter.js Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Specification } from "../common/index.js";
import { MatterElement } from "../elements/index.js";
import { ModelTraversal } from "../logic/ModelTraversal.js";
import { AttributeModel } from "./AttributeModel.js";
import { Children } from "./Children.js";
import { ClusterModel } from "./ClusterModel.js";
import { DatatypeModel } from "./DatatypeModel.js";
import { DeviceTypeModel } from "./DeviceTypeModel.js";
import { FabricModel } from "./FabricModel.js";
import { FieldModel } from "./FieldModel.js";
import { Globals } from "./Globals.js";
import { Model } from "./Model.js";
import { SemanticNamespaceModel } from "./SemanticNamespaceModel.js";

/**
 * The root of a Matter model.  This is the parent for global models.
 */
export class MatterModel extends Model<MatterElement> implements MatterElement {
    override tag: MatterElement.Tag = MatterElement.Tag;
    override isTypeScope = true;
    declare revision?: Specification.Revision;

    override get children(): Children<MatterModel.Child> {
        return super.children as Children<MatterModel.Child>;
    }

    override set children(children: Children.InputIterable<MatterModel.Child>) {
        super.children = children;
    }

    /**
     * The default instance of the canonical MatterModel (also exported directly simply as "Matter").
     */
    static standard: MatterModel = new MatterModel({
        name: "Matter",
        children: Object.values(Globals),
    });

    /**
     * Clusters.
     */
    get clusters() {
        return this.all(ClusterModel);
    }

    /**
     * Device types.
     */
    get deviceTypes() {
        return this.all(DeviceTypeModel);
    }

    /**
     * Semantic tag namespaces.
     */
    get semanticNamespaces() {
        return this.all(SemanticNamespaceModel);
    }

    /**
     * Global datatypes.
     */
    get datatypes() {
        return this.all(FieldModel);
    }

    /**
     * Global attributes.
     */
    get attributes() {
        return this.all(AttributeModel);
    }

    /**
     * Fabrics.
     */
    get fabrics() {
        return this.all(FabricModel);
    }

    /**
     * Create a new MatterModel.
     *
     * @param definition the MatterElement that defines the model
     * @param globals predefined globals, usually tiehr
     */
    constructor(definition: MatterElement.Properties = { name: "Matter", children: [] }) {
        const children = [...(definition.children || [])];
        super({ ...definition, name: definition.name, children });
    }

    /**
     * All sub-cluster global elements from this model.
     *
     * This is the set of utility datatypes required by cluster definitions.
     *
     * The returned elements are clones as we use this to initialize empty models for testing or diagnostic purposes.
     */
    get seedGlobals(): MatterModel.Child[] {
        return this.children.filter(child => child.isSeed).map(child => child.clone());
    }

    static {
        Model.types[MatterElement.Tag] = this;
    }
}

export namespace MatterModel {
    export type Child =
        | ClusterModel
        | DeviceTypeModel
        | FieldModel
        | DatatypeModel
        | AttributeModel
        | FabricModel
        | SemanticNamespaceModel;
}

ModelTraversal.fallbackScope = MatterModel.standard;

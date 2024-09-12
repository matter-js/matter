/**
 * @license
 * Copyright 2022-2024 Matter.js Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { asyncNew } from "@project-chip/matter.js-general";
import { FailsafeContext } from "../../common/FailsafeContext.js";
import { EndpointNumber } from "../../datatype/EndpointNumber.js";
import { Endpoint } from "../../device/Endpoint.js";
import { EndpointInterface } from "../../endpoint/EndpointInterface.js";
import { Fabric } from "../../fabric/Fabric.js";
import { TypeFromSchema } from "../../tlv/TlvSchema.js";
import { BasicInformation } from "../definitions/BasicInformationCluster.js";
import { GeneralCommissioning } from "../definitions/GeneralCommissioningCluster.js";
import { NetworkCommissioning } from "../definitions/NetworkCommissioningCluster.js";
import { OperationalCredentials } from "../definitions/OperationalCredentialsCluster.js";

/**
 * {@link FailsafeContext} implementation for {@link EndpointInterface} API.
 */
export class CommissioningServerFailsafeContext extends FailsafeContext {
    #rootEndpoint: Endpoint;
    #storedNetworkClusterState = new Map<
        EndpointNumber,
        TypeFromSchema<typeof NetworkCommissioning.TlvNetworkInfo>[]
    >();

    constructor(rootEndpoint: Endpoint, options: FailsafeContext.Options) {
        super(options);
        this.#rootEndpoint = rootEndpoint;
    }

    static async create(rootEndpoint: Endpoint, options: FailsafeContext.Options) {
        return asyncNew(this, rootEndpoint, options);
    }

    override async storeEndpointState() {
        await this.#storeEndpointState(this.#rootEndpoint);
    }

    override async restoreFabric(fabric: Fabric) {
        await super.restoreFabric(fabric);
        const operationalCredentialsCluster = this.#rootEndpoint.getClusterServer(OperationalCredentials.Cluster);
        operationalCredentialsCluster?.attributes.nocs.updatedLocalForFabric(fabric);
        operationalCredentialsCluster?.attributes.fabrics.updatedLocalForFabric(fabric);
    }

    override async restoreNetworkState() {
        await this.#restoreEndpointState(this.#rootEndpoint);
    }

    override async revokeFabric(fabric: Fabric) {
        const basicInformationCluster = this.#rootEndpoint.getClusterServer(BasicInformation.Cluster);
        basicInformationCluster?.triggerLeaveEvent?.({ fabricIndex: fabric.fabricIndex });

        await fabric.remove();

        const operationalCredentialsCluster = this.#rootEndpoint.getClusterServer(OperationalCredentials.Cluster);
        operationalCredentialsCluster?.attributes.nocs.updatedLocalForFabric(fabric);
        operationalCredentialsCluster?.attributes.commissionedFabrics.updatedLocal();
        operationalCredentialsCluster?.attributes.fabrics.updatedLocalForFabric(fabric);
        operationalCredentialsCluster?.attributes.trustedRootCertificates.updatedLocal();
    }

    override async restoreBreadcrumb() {
        const generalCommissioningCluster = this.#rootEndpoint.getClusterServer(GeneralCommissioning.Cluster);
        generalCommissioningCluster?.setBreadcrumbAttribute(0);
    }

    async #storeEndpointState(endpoint: Endpoint) {
        // TODO: When implementing Network clusters we somehow need to make sure that a "temporary" network
        //  configuration is not persisted to disk. The NetworkClusterHandlers need to make sure it is only persisted
        //  when the commissioning is completed.
        const networkCluster = endpoint.getClusterServer(NetworkCommissioning.Complete);
        if (networkCluster !== undefined) {
            this.#storedNetworkClusterState.set(endpoint.getNumber(), networkCluster.getNetworksAttribute());
        }
        for (const childEndpoint of endpoint.getChildEndpoints()) {
            await this.#storeEndpointState(childEndpoint);
        }
    }

    async #restoreEndpointState(endpoint: Endpoint) {
        const endpointId = endpoint.getNumber();
        const networkState = this.#storedNetworkClusterState.get(endpointId);
        if (networkState !== undefined) {
            const networkCluster = endpoint.getClusterServer(NetworkCommissioning.Complete);
            if (networkCluster !== undefined) {
                networkCluster.setNetworksAttribute(networkState);
            }
            this.#storedNetworkClusterState.delete(endpointId);
        }
        for (const childEndpoint of endpoint.getChildEndpoints()) {
            await this.#restoreEndpointState(childEndpoint);
        }
    }
}

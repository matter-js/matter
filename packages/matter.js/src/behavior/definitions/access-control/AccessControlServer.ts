/**
 * @license
 * Copyright 2022-2024 Matter.js Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AccessLevel } from "../../../cluster/Cluster.js";
import { AccessControl as AccessControlTypes } from "../../../cluster/definitions/AccessControlCluster.js";
import { InternalError } from "../../../common/MatterError.js";
import { CaseAuthenticatedTag } from "../../../datatype/CaseAuthenticatedTag.js";
import { ClusterId } from "../../../datatype/ClusterId.js";
import { DeviceTypeId } from "../../../datatype/DeviceTypeId.js";
import { EndpointNumber } from "../../../datatype/EndpointNumber.js";
import { GroupId } from "../../../datatype/GroupId.js";
import { NodeId } from "../../../datatype/NodeId.js";
import { EndpointInterface } from "../../../endpoint/EndpointInterface.js";
import { FabricManager } from "../../../fabric/FabricManager.js";
import { Logger } from "../../../log/Logger.js";
import { NodeLifecycle } from "../../../node/NodeLifecycle.js";
import { AccessControlManager, IncomingSubjectDescriptor } from "../../../protocol/interaction/AccessControlManager.js";
import { StatusCode, StatusResponseError } from "../../../protocol/interaction/StatusCode.js";
import { TlvType } from "../../../tlv/TlvCodec.js";
import { TlvTaggedList } from "../../../tlv/TlvObject.js";
import { deepCopy } from "../../../util/DeepCopy.js";
import { isDeepEqual } from "../../../util/DeepEqual.js";
import { AccessControl } from "../../AccessControl.js";
import { ActionContext } from "../../context/ActionContext.js";
import { AccessControlBehavior } from "./AccessControlBehavior.js";

const logger = Logger.get("AccessControlServer");

/**
 * This is the default server implementation of AccessControlBehavior.
 */
export class AccessControlServer extends AccessControlBehavior {
    declare internal: AccessControlServer.Internal;

    override initialize() {
        this.reactTo(this.events.acl$Changing, this.#validateAccessControlListChanges); // Enhanced Validation
        this.reactTo(this.events.acl$Changed, this.#handleAccessControlListChange); // Event handling for changes
        if (
            this.state.extension !== undefined &&
            this.events.extension$Changing !== undefined &&
            this.events.extension$Changed !== undefined
        ) {
            this.reactTo(this.events.extension$Changing, this.#validateAccessControlExtensionChanges); // Enhanced Validation
            this.reactTo(this.events.extension$Changed, this.#handleAccessControlExtensionChange); // Event handling for changes
        }

        const lifecycle = this.endpoint.lifecycle as NodeLifecycle;

        if (lifecycle.online !== undefined) {
            this.reactTo(lifecycle.online, this.#online);
        }
    }

    #online() {
        // Handle Backward compatibility to Matter.js before 0.9.1 and add the missing ACL entry if no entry was set
        // so far by the controller
        const fabrics = this.endpoint.env.get(FabricManager).getFabrics();
        const acl = deepCopy(this.state.acl);
        const originalAclLength = acl.length;
        for (const fabric of fabrics) {
            if (!acl.some(entry => entry.fabricIndex === fabric.fabricIndex)) {
                acl.push({
                    fabricIndex: fabric.fabricIndex,
                    privilege: AccessControlTypes.AccessControlEntryPrivilege.Administer,
                    authMode: AccessControlTypes.AccessControlEntryAuthMode.Case,
                    subjects: [fabric.rootNodeId],
                    targets: null, // entire node
                });
                logger.warn(
                    "Added missing ACL entry for fabric",
                    fabric.fabricIndex,
                    "for Node ID",
                    fabric.rootNodeId,
                    ". This should only happen once after upgrading to matter.js 0.9.1",
                );
            }
        }
        if (acl.length > originalAclLength) {
            this.state.acl = acl;
        }

        logger.info("initializing ACL manager with ACL", acl);
        this.internal.aclManager = new AccessControlManager(
            acl,
            (aclList, aclEntry, subjectDesc, endpoint, clusterId) =>
                this.extensionEntryAccessCheck(
                    aclList as unknown as AccessControlTypes.AccessControlEntryStruct[],
                    aclEntry as unknown as AccessControlTypes.AccessControlEntryStruct,
                    subjectDesc,
                    endpoint,
                    clusterId,
                ),
        );

        this.reactTo(this.events.acl$Changed, this.#updateAccessControlList);
    }

    #validateAccessControlListChanges(value: AccessControlTypes.AccessControlEntryStruct[]) {
        // TODO: This might be not really correct for local ACL changes because there the session fabric could be
        //  different which would lead to missing validation of the relevant entries
        const relevantFabricIndex = this.context.session?.associatedFabric.fabricIndex;

        if (relevantFabricIndex === undefined) {
            return;
        }
        const fabricAcls = value.filter(entry => entry.fabricIndex === relevantFabricIndex);
        if (fabricAcls.length > this.state.accessControlEntriesPerFabric) {
            throw new StatusResponseError("AccessControlEntriesPerFabric exceeded", StatusCode.ResourceExhausted);
        }

        for (const entry of fabricAcls) {
            const { privilege, subjects, targets, authMode } = entry;
            if (subjects !== null && subjects.length > this.state.subjectsPerAccessControlEntry) {
                throw new StatusResponseError("SubjectsPerAccessControlEntry exceeded", StatusCode.ResourceExhausted);
            }

            if (targets !== null && targets.length > this.state.targetsPerAccessControlEntry) {
                throw new StatusResponseError("TargetsPerAccessControlEntry exceeded", StatusCode.ResourceExhausted);
            }

            if (authMode === AccessControlTypes.AccessControlEntryAuthMode.Pase) {
                throw new StatusResponseError("AuthMode for ACL must not be PASE", StatusCode.ConstraintError);
            } else if (authMode === AccessControlTypes.AccessControlEntryAuthMode.Case) {
                if (subjects !== null) {
                    for (const subject of subjects) {
                        if (NodeId.isCaseAuthenticatedTag(subject)) {
                            const cat = NodeId.extractAsCaseAuthenticatedTag(subject);
                            if (CaseAuthenticatedTag.getVersion(cat) === 0) {
                                throw new StatusResponseError(
                                    "CaseAuthenticatedTag version 0 is not allowed",
                                    StatusCode.ConstraintError,
                                );
                            }
                        } else if (!NodeId.isOperationalNodeId(subject)) {
                            throw new StatusResponseError(
                                "Subject must be a valid OperationalNodeId or CaseAuthenticatedTag",
                                StatusCode.ConstraintError,
                            );
                        }
                    }
                }
            } else if (authMode === AccessControlTypes.AccessControlEntryAuthMode.Group) {
                if (privilege === AccessControlTypes.AccessControlEntryPrivilege.Administer) {
                    throw new StatusResponseError(
                        "Group ACLs must not have Administer privilege",
                        StatusCode.ConstraintError,
                    );
                }

                if (subjects !== null) {
                    for (const subject of subjects) {
                        if (GroupId(subject) === GroupId.UNSPECIFIED_GROUP_ID) {
                            throw new StatusResponseError(
                                "Subject must be a valid GroupId for Group ACLs",
                                StatusCode.ConstraintError,
                            );
                        }
                    }
                }
                // TODO For Group authentication, the Group ID identifies the required group, as defined in the Group Key Management Cluster.
            }

            if (targets !== null) {
                for (const target of targets) {
                    const { cluster, endpoint, deviceType } = target;
                    if (deviceType !== null && endpoint !== null) {
                        throw new StatusResponseError(
                            "DeviceType and Endpoint are mutually exclusive",
                            StatusCode.ConstraintError,
                        );
                    }
                    if (cluster === null && endpoint === null && deviceType === null) {
                        throw new StatusResponseError("At least one field must be present", StatusCode.ConstraintError);
                    }
                    if (cluster !== null && !ClusterId.isValid(cluster)) {
                        throw new StatusResponseError("Cluster must be a valid ClusterId", StatusCode.ConstraintError);
                    }
                    if (endpoint !== null && !EndpointNumber.isValid(endpoint)) {
                        throw new StatusResponseError(
                            "Endpoint must be a valid OperationalNodeId",
                            StatusCode.ConstraintError,
                        );
                    }
                    if (deviceType !== null && !DeviceTypeId.isValid(deviceType)) {
                        throw new StatusResponseError(
                            "DeviceType must be a valid DeviceType",
                            StatusCode.ConstraintError,
                        );
                    }
                }
            }
        }
    }

    #handleAccessControlListChange(
        value: AccessControlTypes.AccessControlEntryStruct[],
        oldValue: AccessControlTypes.AccessControlEntryStruct[],
    ) {
        if (this.internal.aclManager === undefined) {
            return; // Too early to send events
        }
        const { session } = this.context;

        // TODO: This might be not really correct for local ACL changes because there the session fabric could be
        //  different which would lead to missing events
        const relevantFabricIndex = session?.associatedFabric.fabricIndex;

        if (relevantFabricIndex === undefined || this.events.accessControlEntryChanged === undefined) {
            return;
        }
        const adminPasscodeId = session === undefined || session?.isPase ? 0 : null;
        const adminNodeId = adminPasscodeId === null ? session?.associatedFabric.rootNodeId : null;
        if (adminNodeId === undefined) {
            // Should never happen
            return;
        }
        const fabricAcls = value.filter(entry => entry.fabricIndex === relevantFabricIndex);
        const oldFabricAcls = oldValue.filter(entry => entry.fabricIndex === relevantFabricIndex);

        let i = 0;
        for (; i < fabricAcls.length; i++) {
            if (!isDeepEqual(fabricAcls[i], oldFabricAcls[i])) {
                const changeType =
                    oldFabricAcls[i] === undefined
                        ? AccessControlTypes.ChangeType.Added
                        : fabricAcls[i] === undefined
                          ? AccessControlTypes.ChangeType.Removed
                          : AccessControlTypes.ChangeType.Changed;
                this.events.accessControlEntryChanged.emit(
                    {
                        changeType,
                        adminNodeId,
                        adminPasscodeId,
                        latestValue:
                            (changeType === AccessControlTypes.ChangeType.Removed ? oldFabricAcls[i] : fabricAcls[i]) ??
                            null,
                        fabricIndex: relevantFabricIndex,
                    },
                    this.context,
                );
            }
        }
        if (oldFabricAcls.length > i) {
            for (let j = oldFabricAcls.length - 1; j >= i; j--) {
                this.events.accessControlEntryChanged.emit(
                    {
                        changeType: AccessControlTypes.ChangeType.Removed,
                        adminNodeId,
                        adminPasscodeId,
                        latestValue: oldValue[j],
                        fabricIndex: relevantFabricIndex,
                    },
                    this.context,
                );
            }
        }
    }

    #validateAccessControlExtensionChanges(value: AccessControlTypes.AccessControlExtensionStruct[]) {
        // TODO: This might be not really correct for local ACL changes because there the session fabric could be
        //  different which would lead to missing validation of the relevant entries
        const relevantFabricIndex = this.context.session?.associatedFabric.fabricIndex;

        if (relevantFabricIndex === undefined) {
            return;
        }

        const fabricExtensions = value.filter(entry => entry.fabricIndex === relevantFabricIndex);

        if (fabricExtensions.length === 0) {
            return;
        }
        if (fabricExtensions.length > 1) {
            throw new StatusResponseError("Extension list must contain a single entry", StatusCode.ConstraintError);
        }

        // we have exactly one entry
        this.extensionEntryValidator(fabricExtensions[0]);
    }

    #handleAccessControlExtensionChange(
        value: AccessControlTypes.AccessControlExtensionStruct[],
        oldValue: AccessControlTypes.AccessControlExtensionStruct[],
    ) {
        if (this.internal.aclManager === undefined) {
            return; // Too early to send events
        }
        const { session } = this.context;

        // TODO: This might be not really correct for local ACL changes because there the session fabric could be
        //  different which would lead to missing events of the relevant entries
        const relevantFabricIndex = session?.associatedFabric.fabricIndex;

        if (relevantFabricIndex === undefined || this.events.accessControlExtensionChanged === undefined) {
            return;
        }
        const adminPasscodeId = session === undefined || session?.isPase ? 0 : null;
        const adminNodeId = adminPasscodeId === null ? session?.associatedFabric.rootNodeId : null;
        if (adminNodeId === undefined) {
            // Should never happen
            return;
        }

        const fabricExtensions = value.filter(entry => entry.fabricIndex === relevantFabricIndex);
        const oldFabricExtensions = oldValue.filter(entry => entry.fabricIndex === relevantFabricIndex);

        const changeType =
            fabricExtensions.length > oldFabricExtensions.length
                ? AccessControlTypes.ChangeType.Added
                : fabricExtensions.length < oldFabricExtensions.length
                  ? AccessControlTypes.ChangeType.Removed
                  : AccessControlTypes.ChangeType.Changed;

        this.events.accessControlExtensionChanged.emit(
            {
                changeType,
                adminNodeId,
                adminPasscodeId,
                latestValue:
                    (changeType === AccessControlTypes.ChangeType.Removed
                        ? oldFabricExtensions[0]
                        : fabricExtensions[0]) ?? null,
                fabricIndex: relevantFabricIndex,
            },
            this.context,
        );
    }

    /**
     * Implements the access control check for the given context, location and endpoint and is called by the
     * InteractionServer. The method returns the list of granted Access privileges for the given context, location and
     * endpoint.
     */
    accessLevelsFor(
        context: ActionContext,
        location: AccessControl.Location,
        endpoint?: EndpointInterface,
    ): AccessLevel[] {
        if (location.cluster === undefined) {
            // Without a cluster, internal behaviors are only accessible internally so this is an irrelevant placeholder
            logger.warn("Access control check without cluster, returning View access level");
            return [AccessLevel.View];
        }
        if (context.session === undefined) {
            // Without a session, we can't determine access levels
            logger.warn("Access control check without session, returning View access level");
            return [AccessLevel.View];
        }
        if (endpoint === undefined) {
            // Without an endpoint, we can't determine access levels, ???
            logger.warn("Access control check without endpoint, returning View access level");
            return [AccessLevel.View];
        }

        return this.aclManager.getGrantedPrivileges(context.session, endpoint, location.cluster);
    }

    /**
     * This method allows to implement the validation of manufacturer specific ACL extensions when an extension entry is
     * added or changed. The default implementation checks whether the extension is a valid TLV and possible to decode.
     *
     * In case of an Error throws StatusResponseError.
     *
     * Override this method in your own behavior to implement custom validation.
     */
    protected extensionEntryValidator(extension: AccessControlTypes.AccessControlExtensionStruct) {
        const { data } = extension;
        if (data.length < 2 || data[0] !== TlvType.List || data[data.length - 1] !== TlvType.EndOfContainer) {
            // Easier to check that way that it is an Listen without any tags in general
            throw new StatusResponseError("Extension must be a valid TLV", StatusCode.ConstraintError);
        }
        try {
            TlvTaggedList({} /* No fields, sufficient for validation */, true).decode(data);
        } catch (error) {
            logger.debug(`Extension TLV decoding failed:`, error);
            throw new StatusResponseError("Extension must be a valid TLV", StatusCode.ConstraintError);
        }
    }

    /**
     * This method allows to implement the validation of manufacturer specific ACL extensions when access control is
     * checked to decide if access is allowed or not.
     * The default implementation always returns true. Override this method in your own behavior to implement custom
     * validation.
     */
    protected extensionEntryAccessCheck(
        _aclList: AccessControlTypes.AccessControlEntryStruct[],
        _aclEntry: AccessControlTypes.AccessControlEntryStruct,
        _subjectDesc: IncomingSubjectDescriptor,
        _endpoint: EndpointInterface,
        _clusterId: ClusterId,
    ) {
        return true;
    }

    /**
     * The AccessControlManager instance that is used to manage the ACL for this behavior.
     */
    get aclManager() {
        if (this.internal.aclManager === undefined) {
            throw new InternalError("ACL manager not initialized yet");
        }
        return this.internal.aclManager;
    }

    #updateAccessControlList(acl: AccessControlTypes.AccessControlEntryStruct[]) {
        if (!this.aclUpdateDelayed) {
            logger.info("ACL updated, updating ACL manager", acl);
            this.aclManager.updateAccessControlList(deepCopy(acl));
        } else {
            logger.info("ACL updated, but ACL manager update is delayed", acl);
            this.internal.delayedAclData = acl;
        }
    }

    /**
     * If set to true, the ACL will not be updated immediately when it changes, but only when the `aclUpdateDelayed`
     * property is set to false again.
     * This is a hack to prevent the ACL from updating while we are in the middle of a write transaction and will be
     * removed again once we somehow handle relevant sub transactions.
     */
    get aclUpdateDelayed() {
        return this.internal.aclUpdateDelayed;
    }

    /**
     * If set to true, the ACL will not be updated immediately when it changes, but only when the `aclUpdateDelayed`
     * property is set to false again.
     * This is a hack to prevent the ACL from updating while we are in the middle of a write transaction and will be
     * removed again once we somehow handle relevant sub transactions.
     */
    set aclUpdateDelayed(value: boolean) {
        logger.info("Setting ACL update delayed to", value);
        if (!value) {
            this.#updateDelayedAccessControlList();
        }
        this.internal.aclUpdateDelayed = value;
    }

    #updateDelayedAccessControlList() {
        if (this.internal.delayedAclData === undefined) {
            return;
        }
        const delayedData = deepCopy(this.internal.delayedAclData);
        this.internal.delayedAclData = undefined;
        logger.info("Updating ACL manager with ACL", delayedData);
        this.aclManager.updateAccessControlList(delayedData);
    }
}

export namespace AccessControlServer {
    export class Internal {
        /** AccessControlManager instance that is used to manage the ACL checks for this device. */
        aclManager?: AccessControlManager;

        /** If set to true ACL updates are delayed while in a write transaction. More details see getter/setter above. */
        aclUpdateDelayed = false;

        /** Latest delayed data of acl */
        delayedAclData?: AccessControlTypes.AccessControlEntryStruct[];
    }
}

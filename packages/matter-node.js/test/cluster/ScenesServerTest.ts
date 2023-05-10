/**
 * @license
 * Copyright 2022-2023 Project CHIP Authors
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { Crypto } from "@project-chip/matter.js/crypto";
import { CryptoNode } from "../../src/crypto/CryptoNode";

Crypto.get = () => new CryptoNode();

import { Time, TimeFake } from "@project-chip/matter.js/time";

Time.get = () => new TimeFake(0);

import * as assert from "assert";
import { ClusterServer, EndpointData, StatusCode } from "@project-chip/matter.js/interaction";
import { SecureSession } from "@project-chip/matter.js/session";
import { MatterDevice } from "@project-chip/matter.js";
import { Fabric, FabricJsonObject } from "@project-chip/matter.js/fabric";
import { GroupsCluster, GroupsClusterHandler, ScenesCluster, ScenesClusterHandler, OnOffCluster, OnOffClusterHandler } from "@project-chip/matter.js/cluster";
import { GroupId, AttributeId, ClusterId } from "@project-chip/matter.js/datatype";
import { getPromiseResolver } from "@project-chip/matter.js/util";
import { SessionType, Message } from "@project-chip/matter.js/codec";
import { callCommandOnClusterServer, createTestSessionWithFabric } from "./ClusterServerTestingUtil";
import { TlvBoolean } from "@project-chip/matter.js/tlv";

describe("Scenes Server test", () => {
    let groupsServer: ClusterServer<any, any, any, any, any> | undefined;
    let scenesServer: ClusterServer<any, any, any, any, any> | undefined;
    let onOffServer: ClusterServer<any, any, any, any, any> | undefined;
    let testFabric: Fabric | undefined;
    let testSession: SecureSession<MatterDevice> | undefined
    let endpoint: EndpointData | undefined;

    // TODO make that nicer and maybe  move to a "testing support library"
    async function initializeTestEnv() {
        groupsServer = new ClusterServer(GroupsCluster, { nameSupport: { groupNames: true } }, GroupsClusterHandler());
        scenesServer = new ClusterServer(ScenesCluster, {
            sceneCount: 0,
            currentScene: 0,
            currentGroup: new GroupId(0),
            sceneValid: false,
            nameSupport: { sceneNames: true },
            lastConfiguredBy: null
        }, ScenesClusterHandler());
        onOffServer = new ClusterServer(OnOffCluster, { onOff: true }, OnOffClusterHandler());
        testSession = await createTestSessionWithFabric();
        testFabric = testSession.getFabric();

        endpoint = {
            id: 1,
            name: '',
            code: 0,
            clusters: new Map<number, ClusterServer<any, any, any, any, any>>(
                [
                    [GroupsCluster.id, groupsServer],
                    [ScenesCluster.id, scenesServer],
                    [OnOffCluster.id, onOffServer]
                ]
            )
        };
    }

    describe("Basic scenes logic", () => {
        beforeAll(async () => {
            await initializeTestEnv();
        });

        it("add new group and scene and verify storage", async () => {
            const groupResult = await callCommandOnClusterServer(groupsServer!, "addGroup", { groupId: new GroupId(1), groupName: "Group 1" }, endpoint!, testSession, { packetHeader: { sessionType: SessionType.Unicast } } as Message);
            assert.ok(groupResult);

            const { promise: firstPromise, resolver: firstResolver } = await getPromiseResolver<FabricJsonObject>();
            testFabric?.setPersistCallback(() => firstResolver(testFabric!.toStorageObject()));

            const result = await callCommandOnClusterServer(scenesServer!, "addScene", {
                groupId: new GroupId(1),
                sceneId: 1,
                sceneName: "Scene 1",
                transitionTime: 10,
                extensionFieldSets: [
                    { clusterId: new ClusterId(OnOffCluster.id), attributeValueList: [{ attributeId: new AttributeId(0), attributeValue: TlvBoolean.encodeTlv(true) }] },
                ]
            }, endpoint!, testSession, { packetHeader: { sessionType: SessionType.Unicast } } as Message);

            const persistedData = await firstPromise;

            assert.deepEqual(result, { code: StatusCode.Success, responseId: 0, response: { status: StatusCode.Success, groupId: new GroupId(1), sceneId: 1 } });
            assert.ok(persistedData);
            assert.ok(persistedData.scopedClusterData);
            const scenesData = persistedData.scopedClusterData.get(ScenesCluster.id);
            assert.ok(scenesData);
            assert.deepEqual(scenesData, new Map([["1", new Map([[1, new Map([[1, { "extensionFieldSets": [{ "attributeValueList": [{ "attributeId": { "id": 0 }, "attributeValue": [{ "tag": undefined, "typeLength": { "type": 8, "value": true }, "value": undefined }] }], "clusterId": { "id": 6 } }], "sceneId": 1, "sceneName": "Scene 1", "sceneTransitionTime": 10, "scenesGroupId": 1, "transitionTime100ms": 0 }]])]])]]));

            assert.equal(scenesServer!.attributes.sceneCount.get(testSession, endpoint), 1);
        });

        it("add another scene on group 1 and verify storage", async () => {
            const { promise: firstPromise, resolver: firstResolver } = await getPromiseResolver<FabricJsonObject>();
            testFabric?.setPersistCallback(() => firstResolver(testFabric!.toStorageObject()));

            const result = await callCommandOnClusterServer(scenesServer!, "addScene", {
                groupId: new GroupId(1),
                sceneId: 2,
                sceneName: "Scene 2",
                transitionTime: 10,
                extensionFieldSets: [
                    { clusterId: new ClusterId(OnOffCluster.id), attributeValueList: [{ attributeId: new AttributeId(0), attributeValue: TlvBoolean.encodeTlv(false) }] },
                ]
            }, endpoint!, testSession, { packetHeader: { sessionType: SessionType.Unicast } } as Message);

            const persistedData = await firstPromise;

            assert.deepEqual(result, { code: StatusCode.Success, responseId: 0, response: { status: StatusCode.Success, groupId: new GroupId(1), sceneId: 2 } });
            assert.ok(persistedData);
            assert.ok(persistedData.scopedClusterData);
            const scenesData = persistedData.scopedClusterData.get(ScenesCluster.id);
            assert.ok(scenesData);
            assert.deepEqual(scenesData, new Map([["1", new Map([[1, new Map([[1, { "extensionFieldSets": [{ "attributeValueList": [{ "attributeId": { "id": 0 }, "attributeValue": [{ "tag": undefined, "typeLength": { "type": 8, "value": true }, "value": undefined }] }], "clusterId": { "id": 6 } }], "sceneId": 1, "sceneName": "Scene 1", "sceneTransitionTime": 10, "scenesGroupId": 1, "transitionTime100ms": 0 }], [2, { "extensionFieldSets": [{ "attributeValueList": [{ "attributeId": { "id": 0 }, "attributeValue": [{ "tag": undefined, "typeLength": { "type": 8, "value": false }, "value": undefined }] }], "clusterId": { "id": 6 } }], "sceneId": 2, "sceneName": "Scene 2", "sceneTransitionTime": 10, "scenesGroupId": 1, "transitionTime100ms": 0 }]])]])]]));
            assert.equal(scenesServer!.attributes.sceneCount.get(testSession, endpoint), 2);
        });

        it("add another new group and scene and verify storage", async () => {
            const groupResult = await callCommandOnClusterServer(groupsServer!, "addGroup", { groupId: new GroupId(2), groupName: "Group 2" }, endpoint!, testSession, { packetHeader: { sessionType: SessionType.Unicast } } as Message);
            assert.ok(groupResult);

            const { promise: firstPromise, resolver: firstResolver } = await getPromiseResolver<FabricJsonObject>();
            testFabric?.setPersistCallback(() => firstResolver(testFabric!.toStorageObject()));

            const result = await callCommandOnClusterServer(scenesServer!, "addScene", {
                groupId: new GroupId(2),
                sceneId: 3,
                sceneName: "Scene 3",
                transitionTime: 10,
                extensionFieldSets: [
                    { clusterId: new ClusterId(OnOffCluster.id), attributeValueList: [{ attributeId: new AttributeId(0), attributeValue: TlvBoolean.encodeTlv(true) }] },
                ]
            }, endpoint!, testSession, { packetHeader: { sessionType: SessionType.Unicast } } as Message);

            const persistedData = await firstPromise;

            assert.deepEqual(result, { code: StatusCode.Success, responseId: 0, response: { status: StatusCode.Success, groupId: new GroupId(2), sceneId: 3 } });
            assert.ok(persistedData);
            assert.ok(persistedData.scopedClusterData);
            const scenesData = persistedData.scopedClusterData.get(ScenesCluster.id);
            assert.ok(scenesData);
            assert.deepEqual(scenesData, new Map([["1", new Map([[1, new Map([[1, { "extensionFieldSets": [{ "attributeValueList": [{ "attributeId": { "id": 0 }, "attributeValue": [{ "tag": undefined, "typeLength": { "type": 8, "value": true }, "value": undefined }] }], "clusterId": { "id": 6 } }], "sceneId": 1, "sceneName": "Scene 1", "sceneTransitionTime": 10, "scenesGroupId": 1, "transitionTime100ms": 0 }], [2, { "extensionFieldSets": [{ "attributeValueList": [{ "attributeId": { "id": 0 }, "attributeValue": [{ "tag": undefined, "typeLength": { "type": 8, "value": false }, "value": undefined }] }], "clusterId": { "id": 6 } }], "sceneId": 2, "sceneName": "Scene 2", "sceneTransitionTime": 10, "scenesGroupId": 1, "transitionTime100ms": 0 }]])], [2, new Map([[3, { "extensionFieldSets": [{ "attributeValueList": [{ "attributeId": { "id": 0 }, "attributeValue": [{ "tag": undefined, "typeLength": { "type": 8, "value": true }, "value": undefined }] }], "clusterId": { "id": 6 } }], "sceneId": 3, "sceneName": "Scene 3", "sceneTransitionTime": 10, "scenesGroupId": 2, "transitionTime100ms": 0 }]])]])]]));
            assert.equal(scenesServer!.attributes.sceneCount.get(testSession, endpoint), 3);
        });

        it("get scene data", async () => {
            const result = await callCommandOnClusterServer(scenesServer!, "viewScene", { groupId: new GroupId(1), sceneId: 1 }, endpoint!, testSession, { packetHeader: { sessionType: SessionType.Unicast } } as Message);

            assert.deepEqual(result, { code: StatusCode.Success, response: { "extensionFieldSets": [{ "attributeValueList": [{ "attributeId": { "id": 0 }, "attributeValue": [{ "tag": undefined, "typeLength": { "type": 8, "value": true }, "value": undefined }] }], "clusterId": { "id": 6 } }], "groupId": { "id": 1 }, "sceneId": 1, "sceneName": "Scene 1", "status": 0, "transitionTime": 10 }, "responseId": 1 });
        });

        it("get scene membership", async () => {
            const result = await callCommandOnClusterServer(scenesServer!, "getSceneMembership", { groupId: new GroupId(1) }, endpoint!, testSession, { packetHeader: { sessionType: SessionType.Unicast } } as Message);

            assert.deepEqual(result, { code: StatusCode.Success, responseId: 6, response: { status: StatusCode.Success, capacity: 252, groupId: new GroupId(1), sceneList: [1, 2] } });
        });

        it("delete scene and verify storage", async () => {
            const { promise: firstPromise, resolver: firstResolver } = await getPromiseResolver<FabricJsonObject>();
            testFabric?.setPersistCallback(() => firstResolver(testFabric!.toStorageObject()));

            const result = await callCommandOnClusterServer(scenesServer!, "removeScene", { groupId: new GroupId(1), sceneId: 2 }, endpoint!, testSession, { packetHeader: { sessionType: SessionType.Unicast } } as Message);

            const persistedData = await firstPromise;

            assert.deepEqual(result, { code: StatusCode.Success, responseId: 2, response: { status: StatusCode.Success, groupId: new GroupId(1), sceneId: 2 } });
            assert.ok(persistedData);
            assert.ok(persistedData.scopedClusterData);
            const scenesData = persistedData.scopedClusterData.get(ScenesCluster.id);
            assert.ok(scenesData);
            assert.deepEqual(scenesData, new Map([["1", new Map([[1, new Map([[1, { "extensionFieldSets": [{ "attributeValueList": [{ "attributeId": { "id": 0 }, "attributeValue": [{ "tag": undefined, "typeLength": { "type": 8, "value": true }, "value": undefined }] }], "clusterId": { "id": 6 } }], "sceneId": 1, "sceneName": "Scene 1", "sceneTransitionTime": 10, "scenesGroupId": 1, "transitionTime100ms": 0 }]])], [2, new Map([[3, { "extensionFieldSets": [{ "attributeValueList": [{ "attributeId": { "id": 0 }, "attributeValue": [{ "tag": undefined, "typeLength": { "type": 8, "value": true }, "value": undefined }] }], "clusterId": { "id": 6 } }], "sceneId": 3, "sceneName": "Scene 3", "sceneTransitionTime": 10, "scenesGroupId": 2, "transitionTime100ms": 0 }]])]])]]));
            assert.equal(scenesServer!.attributes.sceneCount.get(testSession, endpoint), 2);
        });

        it("delete all scenes on one group and verify storage", async () => {
            const { promise: firstPromise, resolver: firstResolver } = await getPromiseResolver<FabricJsonObject>();
            testFabric?.setPersistCallback(() => firstResolver(testFabric!.toStorageObject()));

            const result = await callCommandOnClusterServer(scenesServer!, "removeAllScenes", { groupId: new GroupId(1) }, endpoint!, testSession, { packetHeader: { sessionType: SessionType.Unicast } } as Message);

            const persistedData = await firstPromise;

            assert.deepEqual(result, { code: StatusCode.Success, responseId: 3, response: { status: StatusCode.Success, groupId: new GroupId(1) } });
            assert.ok(persistedData);
            assert.ok(persistedData.scopedClusterData);
            const scenesData = persistedData.scopedClusterData.get(ScenesCluster.id);
            assert.ok(scenesData);
            assert.deepEqual(scenesData, new Map([["1", new Map([[2, new Map([[3, { "extensionFieldSets": [{ "attributeValueList": [{ "attributeId": { "id": 0 }, "attributeValue": [{ "tag": undefined, "typeLength": { "type": 8, "value": true }, "value": undefined }] }], "clusterId": { "id": 6 } }], "sceneId": 3, "sceneName": "Scene 3", "sceneTransitionTime": 10, "scenesGroupId": 2, "transitionTime100ms": 0 }]])]])]]));
            assert.equal(scenesServer!.attributes.sceneCount.get(testSession, endpoint), 1);
        });

        it("delete one group and verify storage", async () => {
            const { promise: firstPromise, resolver: firstResolver } = await getPromiseResolver<FabricJsonObject>();
            testFabric?.setPersistCallback(() => firstResolver(testFabric!.toStorageObject()));

            const result = await callCommandOnClusterServer(groupsServer!, "removeGroup", { groupId: new GroupId(2) }, endpoint!, testSession, { packetHeader: { sessionType: SessionType.Unicast } } as Message);

            const persistedData = await firstPromise;

            assert.deepEqual(result, { code: StatusCode.Success, responseId: 3, response: { status: StatusCode.Success, groupId: new GroupId(2) } });
            assert.ok(persistedData);
            assert.ok(persistedData.scopedClusterData);
            const scenesData = persistedData.scopedClusterData.get(ScenesCluster.id);
            assert.ok(scenesData);
            assert.deepEqual(scenesData, new Map([["1", new Map([])]]));
            assert.equal(scenesServer!.attributes.sceneCount.get(testSession, endpoint), 0);
        });
    });

    describe("General error cases", () => {
        beforeAll(async () => {
            await initializeTestEnv();
        });

        it("error on read scene on non existence group", async () => {
            const result = await callCommandOnClusterServer(scenesServer!, "viewScene", { groupId: new GroupId(1), sceneId: 1 }, endpoint!, testSession, { packetHeader: { sessionType: SessionType.Unicast } } as Message);

            assert.ok(result);
            assert.equal(result.code, StatusCode.Success);
            assert.equal(result.response.status, StatusCode.InvalidCommand);
            assert.deepEqual(result.response.groupId, new GroupId(1));
            assert.deepEqual(result.response.sceneId, 1);
        });

        it("error on read non existent scene", async () => {
            const resultGroup = await callCommandOnClusterServer(groupsServer!, "addGroup", { groupId: new GroupId(1), groupName: "Group 1" }, endpoint!, testSession, { packetHeader: { sessionType: SessionType.Unicast } } as Message);
            assert.ok(resultGroup);

            const result = await callCommandOnClusterServer(scenesServer!, "viewScene", { groupId: new GroupId(1), sceneId: 1 }, endpoint!, testSession, { packetHeader: { sessionType: SessionType.Unicast } } as Message);

            assert.ok(result);
            assert.equal(result.code, StatusCode.Success);
            assert.equal(result.response.status, StatusCode.NotFound);
            assert.deepEqual(result.response.groupId, new GroupId(1));
            assert.deepEqual(result.response.sceneId, 1);
        });

        it("error on delete non existing scene", async () => {
            const result = await callCommandOnClusterServer(scenesServer!, "removeScene", { groupId: new GroupId(1), sceneId: 1 }, endpoint!, testSession, { packetHeader: { sessionType: SessionType.Unicast } } as Message);

            assert.ok(result);
            assert.equal(result.code, StatusCode.Success);
            assert.equal(result.response.status, StatusCode.NotFound);
            assert.deepEqual(result.response.groupId, new GroupId(1));
            assert.deepEqual(result.response.sceneId, 1);
        });

        it("error on adding scene with too long name", async () => {
            const result = await callCommandOnClusterServer(scenesServer!, "addScene", { groupId: new GroupId(1), sceneId: 1, sceneName: '12345678901234567', transitionTime: 2, extensionFieldSets: [] }, endpoint!, testSession, { packetHeader: { sessionType: SessionType.Unicast } } as Message);

            assert.ok(result);
            assert.equal(result.code, StatusCode.Success);
            assert.equal(result.response.status, StatusCode.ConstraintError);
            assert.deepEqual(result.response.groupId, new GroupId(1));
            assert.deepEqual(result.response.sceneId, 1);
        });

        it("error on Groupcast message", async () => {
            await assert.rejects(async () => await callCommandOnClusterServer(scenesServer!, "viewScene", { groupId: new GroupId(1), sceneId: 1 }, endpoint!, testSession, { packetHeader: { sessionType: SessionType.Group } } as Message),
                {
                    message: "Groupcast not supported"
                });
        });

        it("recallScene on not existing group id", async () => {
            await assert.rejects(async () => await callCommandOnClusterServer(scenesServer!, "recallScene", {
                groupId: new GroupId(5),
                sceneId: 1,
            }, endpoint!, testSession, { packetHeader: { sessionType: SessionType.Unicast } } as Message), {
                message: '(133) Group 5 does not exist on this endpoint',
                code: StatusCode.InvalidCommand
            });
        });

        it("recallScene on not existing scene id", async () => {
            await assert.rejects(async () => await callCommandOnClusterServer(scenesServer!, "recallScene", {
                groupId: new GroupId(1),
                sceneId: 10,
            }, endpoint!, testSession, { packetHeader: { sessionType: SessionType.Unicast } } as Message), {
                message: '(139) Scene 10 does not exist for group 1',
                code: StatusCode.NotFound
            });
        });

    });

    describe("Scene Logic tests", () => {
        beforeAll(async () => {
            await initializeTestEnv();
        });

        it("storeScene", async () => {
            assert.equal(scenesServer?.attributes.currentScene.get(), 0);
            assert.deepEqual(scenesServer?.attributes.currentGroup.get(), new GroupId(0));

            const groupResult = await callCommandOnClusterServer(groupsServer!, "addGroup", { groupId: new GroupId(1), groupName: "Group 1" }, endpoint!, testSession, { packetHeader: { sessionType: SessionType.Unicast } } as Message);
            assert.ok(groupResult);

            const { promise: firstPromise, resolver: firstResolver } = await getPromiseResolver<FabricJsonObject>();
            testFabric?.setPersistCallback(() => firstResolver(testFabric!.toStorageObject()));

            const result = await callCommandOnClusterServer(scenesServer!, "storeScene", {
                groupId: new GroupId(1),
                sceneId: 1,
            }, endpoint!, testSession, { packetHeader: { sessionType: SessionType.Unicast } } as Message);

            const persistedData = await firstPromise;

            assert.deepEqual(result, { code: StatusCode.Success, responseId: 4, response: { status: StatusCode.Success, groupId: new GroupId(1), sceneId: 1 } });
            assert.ok(persistedData);
            assert.ok(persistedData.scopedClusterData);
            const scenesData = persistedData.scopedClusterData.get(ScenesCluster.id);
            assert.ok(scenesData);
            assert.deepEqual(scenesData, new Map([["1", new Map([[1, new Map([[1, { "extensionFieldSets": [{ "attributeValueList": [{ "attributeId": { "id": 0 }, "attributeValue": [{ "tag": undefined, "typeLength": { "type": 8, "value": true } }] }], "clusterId": { "id": 6 } }], "sceneId": 1, "sceneName": "", "sceneTransitionTime": 0, "scenesGroupId": 1, "transitionTime100ms": 0 }]])]])]]));

            assert.equal(scenesServer?.attributes.sceneValid.get(testSession, endpoint), true);
            assert.equal(scenesServer?.attributes.currentScene.get(), 1);
            assert.deepEqual(scenesServer?.attributes.currentGroup.get(), new GroupId(1));
        });

        it("copy one Scene error to group does not exist", async () => {
            const result = await callCommandOnClusterServer(scenesServer!, "copyScene", {
                mode: 0,
                groupIdFrom: new GroupId(5),
                sceneIdFrom: 1,
                groupIdTo: new GroupId(1),
                sceneIdTo: 2,
            }, endpoint!, testSession, { packetHeader: { sessionType: SessionType.Unicast } } as Message);

            assert.deepEqual(result, { code: StatusCode.Success, responseId: 66, response: { status: StatusCode.InvalidCommand, groupIdFrom: new GroupId(5), sceneIdFrom: 1 } });
        });

        it("copy one Scene same group", async () => {
            const { promise: firstPromise, resolver: firstResolver } = await getPromiseResolver<FabricJsonObject>();
            testFabric?.setPersistCallback(() => firstResolver(testFabric!.toStorageObject()));

            const result = await callCommandOnClusterServer(scenesServer!, "copyScene", {
                mode: 0,
                groupIdFrom: new GroupId(1),
                sceneIdFrom: 1,
                groupIdTo: new GroupId(1),
                sceneIdTo: 2,
            }, endpoint!, testSession, { packetHeader: { sessionType: SessionType.Unicast } } as Message);

            assert.deepEqual(result, { code: StatusCode.Success, responseId: 66, response: { status: StatusCode.Success, groupIdFrom: new GroupId(1), sceneIdFrom: 1 } });

            const persistedData = await firstPromise;

            assert.ok(persistedData);
            assert.ok(persistedData.scopedClusterData);
            const scenesData = persistedData.scopedClusterData.get(ScenesCluster.id);
            assert.ok(scenesData);
            assert.deepEqual(scenesData, new Map([["1", new Map([[1, new Map([[1, { "extensionFieldSets": [{ "attributeValueList": [{ "attributeId": { "id": 0 }, "attributeValue": [{ "tag": undefined, "typeLength": { "type": 8, "value": true } }] }], "clusterId": { "id": 6 } }], "sceneId": 1, "sceneName": "", "sceneTransitionTime": 0, "scenesGroupId": 1, "transitionTime100ms": 0 }], [2, { "extensionFieldSets": [{ "attributeValueList": [{ "attributeId": { "id": 0 }, "attributeValue": [{ "tag": undefined, "typeLength": { "type": 8, "value": true } }] }], "clusterId": { "id": 6 } }], "sceneId": 2, "sceneName": "", "sceneTransitionTime": 0, "scenesGroupId": 1, "transitionTime100ms": 0 }]])]])]]));
        });

        it("copy one Scene other group", async () => {
            const groupResult = await callCommandOnClusterServer(groupsServer!, "addGroup", { groupId: new GroupId(2), groupName: "Group 2" }, endpoint!, testSession, { packetHeader: { sessionType: SessionType.Unicast } } as Message);
            assert.ok(groupResult);

            const { promise: firstPromise, resolver: firstResolver } = await getPromiseResolver<FabricJsonObject>();
            testFabric?.setPersistCallback(() => firstResolver(testFabric!.toStorageObject()));

            const result = await callCommandOnClusterServer(scenesServer!, "copyScene", {
                mode: 0,
                groupIdFrom: new GroupId(1),
                sceneIdFrom: 1,
                groupIdTo: new GroupId(2),
                sceneIdTo: 3,
            }, endpoint!, testSession, { packetHeader: { sessionType: SessionType.Unicast } } as Message);

            assert.deepEqual(result, { code: StatusCode.Success, responseId: 66, response: { status: StatusCode.Success, groupIdFrom: new GroupId(1), sceneIdFrom: 1 } });

            const persistedData = await firstPromise;

            assert.ok(persistedData);
            assert.ok(persistedData.scopedClusterData);
            const scenesData = persistedData.scopedClusterData.get(ScenesCluster.id);
            assert.ok(scenesData);
            assert.deepEqual(scenesData, new Map([["1", new Map([[1, new Map([[1, { "extensionFieldSets": [{ "attributeValueList": [{ "attributeId": { "id": 0 }, "attributeValue": [{ "tag": undefined, "typeLength": { "type": 8, "value": true } }] }], "clusterId": { "id": 6 } }], "sceneId": 1, "sceneName": "", "sceneTransitionTime": 0, "scenesGroupId": 1, "transitionTime100ms": 0 }], [2, { "extensionFieldSets": [{ "attributeValueList": [{ "attributeId": { "id": 0 }, "attributeValue": [{ "tag": undefined, "typeLength": { "type": 8, "value": true } }] }], "clusterId": { "id": 6 } }], "sceneId": 2, "sceneName": "", "sceneTransitionTime": 0, "scenesGroupId": 1, "transitionTime100ms": 0 }]])], [2, new Map([[3, { "extensionFieldSets": [{ "attributeValueList": [{ "attributeId": { "id": 0 }, "attributeValue": [{ "tag": undefined, "typeLength": { "type": 8, "value": true } }] }], "clusterId": { "id": 6 } }], "sceneId": 3, "sceneName": "", "sceneTransitionTime": 0, "scenesGroupId": 2, "transitionTime100ms": 0 }]])]])]]));
        });

        it("copy all Scenes to other group", async () => {
            const groupResult = await callCommandOnClusterServer(groupsServer!, "addGroup", { groupId: new GroupId(3), groupName: "Group 3" }, endpoint!, testSession, { packetHeader: { sessionType: SessionType.Unicast } } as Message);
            assert.ok(groupResult);

            const { promise: firstPromise, resolver: firstResolver } = await getPromiseResolver<FabricJsonObject>();
            testFabric?.setPersistCallback(() => firstResolver(testFabric!.toStorageObject()));

            const result = await callCommandOnClusterServer(scenesServer!, "copyScene", {
                mode: { copyAllScenes: true },
                groupIdFrom: new GroupId(1),
                sceneIdFrom: 0,
                groupIdTo: new GroupId(3),
                sceneIdTo: 0,
            }, endpoint!, testSession, { packetHeader: { sessionType: SessionType.Unicast } } as Message);

            assert.deepEqual(result, { code: StatusCode.Success, responseId: 66, response: { status: StatusCode.Success, groupIdFrom: new GroupId(1), sceneIdFrom: 0 } });

            const persistedData = await firstPromise;

            assert.ok(persistedData);
            assert.ok(persistedData.scopedClusterData);
            const scenesData = persistedData.scopedClusterData.get(ScenesCluster.id);
            assert.ok(scenesData);
            assert.deepEqual(scenesData, new Map([["1", new Map([[1, new Map([[1, { "extensionFieldSets": [{ "attributeValueList": [{ "attributeId": { "id": 0 }, "attributeValue": [{ "tag": undefined, "typeLength": { "type": 8, "value": true } }] }], "clusterId": { "id": 6 } }], "sceneId": 1, "sceneName": "", "sceneTransitionTime": 0, "scenesGroupId": 1, "transitionTime100ms": 0 }], [2, { "extensionFieldSets": [{ "attributeValueList": [{ "attributeId": { "id": 0 }, "attributeValue": [{ "tag": undefined, "typeLength": { "type": 8, "value": true } }] }], "clusterId": { "id": 6 } }], "sceneId": 2, "sceneName": "", "sceneTransitionTime": 0, "scenesGroupId": 1, "transitionTime100ms": 0 }]])], [2, new Map([[3, { "extensionFieldSets": [{ "attributeValueList": [{ "attributeId": { "id": 0 }, "attributeValue": [{ "tag": undefined, "typeLength": { "type": 8, "value": true } }] }], "clusterId": { "id": 6 } }], "sceneId": 3, "sceneName": "", "sceneTransitionTime": 0, "scenesGroupId": 2, "transitionTime100ms": 0 }]])], [3, new Map([[1, { "extensionFieldSets": [{ "attributeValueList": [{ "attributeId": { "id": 0 }, "attributeValue": [{ "tag": undefined, "typeLength": { "type": 8, "value": true } }] }], "clusterId": { "id": 6 } }], "sceneId": 1, "sceneName": "", "sceneTransitionTime": 0, "scenesGroupId": 3, "transitionTime100ms": 0 }], [2, { "extensionFieldSets": [{ "attributeValueList": [{ "attributeId": { "id": 0 }, "attributeValue": [{ "tag": undefined, "typeLength": { "type": 8, "value": true } }] }], "clusterId": { "id": 6 } }], "sceneId": 2, "sceneName": "", "sceneTransitionTime": 0, "scenesGroupId": 3, "transitionTime100ms": 0 }]])]])]]));
        });

        it("recallScene", async () => {
            onOffServer?.attributes.onOff.set(false);
            assert.equal(onOffServer?.attributes.onOff.get(), false);
            assert.deepEqual(scenesServer?.attributes.currentGroup.get(), new GroupId(1));
            assert.equal(scenesServer?.attributes.currentScene.get(), 1);

            assert.equal(scenesServer?.attributes.sceneValid.get(testSession, endpoint), false);

            const result = await callCommandOnClusterServer(scenesServer!, "recallScene", {
                groupId: new GroupId(3),
                sceneId: 2,
            }, endpoint!, testSession, { packetHeader: { sessionType: SessionType.Unicast } } as Message);

            assert.deepEqual(result, { code: StatusCode.Success, responseId: 5, response: undefined });
            assert.equal(onOffServer?.attributes.onOff.get(), true);
            assert.deepEqual(scenesServer?.attributes.currentGroup.get(), new GroupId(3));
            assert.equal(scenesServer?.attributes.currentScene.get(), 2);
            assert.equal(scenesServer?.attributes.sceneValid.get(testSession, endpoint), true);
        });

        it("delete all groups and verify storage", async () => {
            const { promise: firstPromise, resolver: firstResolver } = await getPromiseResolver<FabricJsonObject>();
            testFabric?.setPersistCallback(() => firstResolver(testFabric!.toStorageObject()));

            const result = await callCommandOnClusterServer(groupsServer!, "removeAllGroups", undefined, endpoint!, testSession, { packetHeader: { sessionType: SessionType.Unicast } } as Message);

            const persistedData = await firstPromise;

            assert.deepEqual(result, { code: StatusCode.Success, responseId: 4, response: undefined });
            assert.ok(persistedData);
            assert.ok(persistedData.scopedClusterData);
            const scenesData = persistedData.scopedClusterData.get(ScenesCluster.id);
            assert.ok(scenesData);
            assert.deepEqual(scenesData, new Map([["1", new Map([])]]));
        });
    });
});

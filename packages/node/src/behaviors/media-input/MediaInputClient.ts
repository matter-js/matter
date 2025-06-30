/**
 * @license
 * Copyright 2022-2025 Matter.js Authors
 * SPDX-License-Identifier: Apache-2.0
 */

/*** THIS FILE IS GENERATED, DO NOT EDIT ***/

import { MediaInput } from "#clusters/media-input";
import { ClusterBehavior } from "../../behavior/cluster/ClusterBehavior.js";
import { Identity } from "#general";

export const MediaInputClientConstructor = ClusterBehavior.for(MediaInput.Complete);
export interface MediaInputClient extends InstanceType<typeof MediaInputClientConstructor> {}
export interface MediaInputClientConstructor extends Identity<typeof MediaInputClientConstructor> {}
export const MediaInputClient: MediaInputClientConstructor = MediaInputClientConstructor;

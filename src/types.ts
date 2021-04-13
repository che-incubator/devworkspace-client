/*
 * Copyright (c) 2018-2021 Red Hat, Inc.
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *   Red Hat, Inc. - initial API and implementation
 */

import * as k8s from '@kubernetes/client-node';
import { AxiosInstance } from 'axios';

export interface IDevWorkspaceClient {
    getNodeApi(config: INodeConfig): IDevWorkspaceClientApi;
}

export interface IDevWorkspaceApi {
    config: k8s.KubeConfig | AxiosInstance;
    listInNamespace(namespace: string): Promise<IDevWorkspace[]>;
    getByName(namespace: string, name: string): Promise<IDevWorkspace>;
    create(
        devfile: IDevWorkspaceDevfile,
        routingClass: string,
        started?: boolean,
    ): Promise<IDevWorkspace>;
    update(devworkspace: IDevWorkspace): Promise<IDevWorkspace>;
    delete(namespace: string, name: string): Promise<void>;
    changeStatus(namespace: string, name: string, started: boolean): Promise<IDevWorkspace>;
}

export interface IDevWorkspaceTemplateApi {
    config: k8s.KubeConfig | AxiosInstance;
    listInNamespace(namespace: string): Promise<IDevWorkspaceTemplate[]>;
    getByName(namespace: string, name: string): Promise<IDevWorkspaceTemplate>;
    delete(namespace: string, name: string): Promise<void>;
    create(template: IDevWorkspaceTemplate): Promise<IDevWorkspaceTemplate>;
}

export interface IDevWorkspaceClientApi {
    config: k8s.KubeConfig | AxiosInstance;
    devworkspaceApi: IDevWorkspaceApi;
    templateApi: IDevWorkspaceTemplateApi;
    cheApi: ICheApi;
    isDevWorkspaceApiEnabled(): Promise<boolean>;
}

export interface ICheApi {
    config: k8s.KubeConfig | AxiosInstance;
    initializeNamespace(namespace: string): Promise<void>;
}

export interface IDevWorkspace {
    apiVersion: string;
    kind: string;
    metadata: {
        name: string;
        namespace: string;
        creationTimestamp?: string;
        deletionTimestamp?: string;
        uid?: string;
    };
    spec: {
        started: boolean;
        routingClass: string;
        template: {
            projects?: any;
            components?: any[];
            commands?: any;
            events?: any;
        }
    };
    status: {
        ideUrl: string;
        phase: string;
        devworkspaceId: string;
        message?: string;
    };
}

export interface IDevWorkspaceTemplate {
    apiVersion: string;
    kind: string;
    metadata: {
        name: string;
        namespace: string;
        ownerReferences: OwnerRefs[];
    };
    spec: IDevWorkspaceDevfile;
}

export interface OwnerRefs {
    apiVersion: string;
    kind: string;
    name: string;
    uid: string;
}

export interface IDevWorkspaceDevfile {
    schemaVersion: string;
    metadata: {
        name: string;
        namespace: string;
        annotations?: {};
    };
    projects?: any;
    components?: any;
    commands?: any;
    events?: any;
}

export interface INodeConfig {
    inCluster: boolean;
}

export interface IKubernetesGroupsModel {
    name: string;
    versions: {
        version: string;
    }[];
}

export const INVERSIFY_TYPES = {
    IDevWorkspaceClient: Symbol('IDevWorkspaceClient'),
    INodeApiFactory: Symbol('Factory<NodeApi>'),
    IDevWorkspaceNodeClientApi: Symbol('IDevWorkspaceNodeClientApi'),
    IDevWorkspaceNodeTemplateApi: Symbol('IDevWorkspaceNodeTemplateApi'),
    IDevWorkspaceNodeApi: Symbol('IDevWorkspaceNodeApi'),
    IDevWorkspaceNodeCheApi: Symbol('IDevWorkspaceNodeCheApi')
}

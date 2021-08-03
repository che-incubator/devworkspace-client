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

export interface IDevWorkspaceClient {
    getNodeApi(config: INodeConfig): IDevWorkspaceClientApi;
}

export type IDevWorkspaceCallbacks = {
    onStatusChange: (statusUpdate: { status: string; workspaceId: string }) => void;
    onDeleted: (workspaceId: string) => void;
    onAdded: (workspace: IDevWorkspace) => void;
    onError: (error: string) => void;
}

export interface IDevWorkspaceWatcher {
    config: k8s.KubeConfig;
    watcher(namespace: string, callbacks: IDevWorkspaceCallbacks): Promise<{ abort: Function }>;
}

export interface IDevWorkspaceApi {
    config: k8s.KubeConfig;
    listInNamespace(namespace: string): Promise<IDevWorkspace[]>;
    getByName(namespace: string, name: string): Promise<IDevWorkspace>;
    create(
        devfile: IDevWorkspaceDevfile,
        routingClass: string,
        started?: boolean,
    ): Promise<IDevWorkspace>;
    update(devworkspace: IDevWorkspace): Promise<IDevWorkspace>;
    delete(namespace: string, name: string): Promise<void>;
    patch(namespace: string, name: string, patches: IPatch[]): Promise<IDevWorkspace>;
}

export interface IDevWorkspaceTemplateApi {
    config: k8s.KubeConfig;
    listInNamespace(namespace: string): Promise<IDevWorkspaceTemplate[]>;
    getByName(namespace: string, name: string): Promise<IDevWorkspaceTemplate>;
    delete(namespace: string, name: string): Promise<void>;
    create(template: IDevWorkspaceTemplate): Promise<IDevWorkspaceTemplate>;
}

export interface IDevWorkspaceClientApi {
    config: k8s.KubeConfig;
    devworkspaceApi: IDevWorkspaceApi;
    templateApi: IDevWorkspaceTemplateApi;
    cheApi: ICheApi;
    devWorkspaceWatcher: IDevWorkspaceWatcher;
    isDevWorkspaceApiEnabled(): Promise<boolean>;
}

export interface ICheApi {
    config: k8s.KubeConfig;
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
        annotations?: any;
    };
    spec: IDevWorkspaceSpec;
    status: {
        mainUrl: string;
        phase: string;
        devworkspaceId: string;
        message?: string;
    };
}

export interface IDevWorkspaceSpec {
    started: boolean;
    routingClass: string;
    template: {
        projects?: any;
        components?: any[];
        commands?: any;
        events?: any;
    };
}

export interface IDevWorkspaceTemplate {
    apiVersion: string;
    kind: string;
    metadata: {
        name: string;
        namespace: string;
        ownerReferences: IOwnerRefs[];
    };
    spec: IDevWorkspaceDevfile;
}

export interface IOwnerRefs {
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
        attributes?: { [key: string]: any };
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
    versions: { version: string }[];
}

export interface IPatch {
    op: string;
    path: string;
    value?: any;
}

export const INVERSIFY_TYPES = {
    IDevWorkspaceClient: Symbol('IDevWorkspaceClient'),
    INodeApiFactory: Symbol('Factory<NodeApi>'),
    IDevWorkspaceNodeClientApi: Symbol('IDevWorkspaceNodeClientApi'),
    IDevWorkspaceNodeTemplateApi: Symbol('IDevWorkspaceNodeTemplateApi'),
    IDevWorkspaceNodeApi: Symbol('IDevWorkspaceNodeApi'),
    IDevWorkspaceNodeCheApi: Symbol('IDevWorkspaceNodeCheApi'),
    IDevWorkspaceWatcher: Symbol('IDevWorkspaceWatcher')
};

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
import { V1alpha2DevWorkspace, V1alpha2DevWorkspaceTemplate, V220Devfile } from '@devfile/api';

export interface IDevWorkspaceClient {
    getNodeApi(config: INodeConfig): IDevWorkspaceClientApi;
}

export interface IDevWorkspaceApi {
    config: k8s.KubeConfig | AxiosInstance;
    listInNamespace(namespace: string): Promise<V1alpha2DevWorkspace[]>;
    getByName(namespace: string, name: string): Promise<V1alpha2DevWorkspace>;
    create(
        devfile: V220Devfile,
        routingClass: string,
        started?: boolean,
    ): Promise<V1alpha2DevWorkspace>;
    update(devworkspace: V1alpha2DevWorkspace): Promise<V1alpha2DevWorkspace>;
    delete(namespace: string, name: string): Promise<void>;
    patch(namespace: string, name: string, patches: Patch[]): Promise<V1alpha2DevWorkspace>;
    changeStatus(namespace: string, name: string, started: boolean): Promise<V1alpha2DevWorkspace>;
}

export interface IDevWorkspaceTemplateApi {
    config: k8s.KubeConfig | AxiosInstance;
    listInNamespace(namespace: string): Promise<V1alpha2DevWorkspaceTemplate[]>;
    getByName(namespace: string, name: string): Promise<V1alpha2DevWorkspaceTemplate>;
    delete(namespace: string, name: string): Promise<void>;
    create(template: V1alpha2DevWorkspaceTemplate): Promise<V1alpha2DevWorkspaceTemplate>;
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


export interface OwnerRefs {
    apiVersion: string;
    kind: string;
    name: string;
    uid: string;
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

export interface Patch {
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
    IDevWorkspaceNodeCheApi: Symbol('IDevWorkspaceNodeCheApi')
}

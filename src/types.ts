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

export interface IDevWorkspaceApi {
    listInNamespace(namespace: string): Promise<IDevWorkspace[]>;
    getByName(namespace: string, workspaceName: string): Promise<IDevWorkspace>;
    create(
        devfile: IDevWorkspaceDevfile,
        defaultEditor?: string,
        defaultPlugins?: string[]
    ): Promise<IDevWorkspace>;
    delete(namespace: string, name: string): Promise<void>;
    changeStatus(namespace: string, name: string, started: boolean): Promise<IDevWorkspace>;
    initializeNamespace(namespace: string): Promise<void>;
}

export interface IDevWorkspaceTemplateApi {
    listInNamespace(namespace: string): Promise<IDevWorkspaceTemplate[]>;
    getByName(namespace: string, workspaceName: string): Promise<IDevWorkspaceTemplate>;
    delete(namespace: string, name: string): Promise<void>;
    create(template: IDevWorkspaceTemplate): Promise<IDevWorkspaceTemplate>;
}

export interface IDevWorkspaceClientApi {
    workspaceApi: IDevWorkspaceApi;
    templateApi: IDevWorkspaceTemplateApi;
    isDevWorkspaceApiEnabled(): Promise<boolean>;
}

export interface IDevWorkspace {
    apiVersion: string;
    kind: string;
    metadata: {
        name: string;
        namespace: string;
        creationTimestamp?: string;
        deletionTimestamp?: string;
    };
    spec: {
        started: boolean;
        routingClass: string;
        template: {
            projects?: any;
            components?: any;
            commands?: any;
            events?: any;
        }
    };
    status: {
        ideUrl: string;
        phase: string;
        workspaceId: string;
        message?: string;
    };
}

export interface IDevWorkspaceTemplate {
    apiVersion: string;
    kind: string;
    metadata: {
        name: string;
        namespace: string;
    };
    spec: IDevWorkspaceDevfile;
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

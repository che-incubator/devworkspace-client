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
    getAllWorkspaces(defaultNamespace: string): Promise<IDevWorkspace[]>;
    getWorkspaceByName(namespace: string, workspaceName: string): Promise<IDevWorkspace>;
    create(
        devfile: IDevWorkspaceDevfile,
        defaultEditor?: string,
        defaultPlugins?: string[]
    ): Promise<IDevWorkspace>;
    delete(namespace: string, name: string): Promise<void>;
    changeWorkspaceStatus(namespace: string, name: string, started: boolean): Promise<IDevWorkspace>;
    initializeNamespace(namespace: string): Promise<void>;
    isApiEnabled(): Promise<boolean>;
}

export interface IDevWorkspaceClientApi {
    workspaceApi: IDevWorkspaceApi;
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
    };
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

export interface IKubernetesGroupsModel {
    name: string;
}

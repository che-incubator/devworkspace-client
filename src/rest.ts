/*********************************************************************
 * Copyright (c) 2018 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 **********************************************************************/

import { AxiosInstance } from 'axios';

export interface IDevWorkspaceApi {
    getAllDevWorkspaces<T>(): Promise<T[]>;
    getAllDevWorkspacesByNamespace<T>(namespace: string): Promise<T[]>;
    getDevWorkspaceById<T>(workspaceId: string): Promise<T | undefined>;
    stop(workspaceId: string): void;
    subscribeWorkspaceStatus(workspace: any, callback: Function): Promise<void>;
}

export class DevWorkspaceApi implements IDevWorkspaceApi {

    private readonly axios: AxiosInstance;
    private readonly devworkspaceVersion: string;

    constructor(axios: AxiosInstance) {
        this.devworkspaceVersion = 'v1alpha2';
        this.axios = axios;
    }

    public async getAllDevWorkspaces<T>(): Promise<T[]> {
        try {
            const resp = await this.axios.request({
                method: 'GET',
                url: '/apis/workspace.devfile.io/v1alpha2/namespaces/sample/devworkspaces',
            });
            const devworkspaces: T[] = [];
            resp.data.items.forEach((element: any) => {
                devworkspaces.push(element);
            });
            return devworkspaces;
        } catch (e) {
            console.warn(e);
            return [];
        }
    }

    public async getAllDevWorkspacesByNamespace<T>(namespace: string): Promise<T[]> {
        try {
            const resp = await this.axios.request<T[]>({
                method: 'GET',
                url: `/apis/workspace.devfile.io/${this.devworkspaceVersion}/namespaces/${namespace}/devworkspaces`,
            });
            return resp.data;
        } catch (e) {
            console.warn(e);
            return [];
        }
    }

    public getDevWorkspaceById<T>(workspaceId: string): Promise<T | undefined> {
        /**
         * Kubernetes doesn't allow you to use the field selector status.workspaceId on devworkspaces
         * so you need to get them all and find the one you are looking for yourself
         */
        return this.getAllDevWorkspaces().then((workspaces: any) => {
            let foundWorkspace;
            workspaces.forEach((workspace: any) => {
                if (workspace.status.workspaceId === workspaceId) {
                    foundWorkspace = workspace;
                }
            });
            return foundWorkspace;
        });
    }

    public async stop(workspaceId: string): Promise<void> {
        const workspace = await this.getDevWorkspaceById(workspaceId);
        if (!workspace) {
            throw new Error('Workspace not found');
        }
    }

    public async subscribeWorkspaceStatus(workspace: any, callback: Function): Promise<void> {
        let socket = new WebSocket(`ws://localhost:3333/api/unsupported/k8s/apis/workspace.devfile.io/${this.devworkspaceVersion}/namespaces/${workspace.metadata.namespace}/devworkspaces?watch=true`);

        socket.onopen = function(e) {
            console.log('Opened websocket');
            console.log(e);
        };

        socket.onmessage = function(event) {
            console.log(event);
        };

        socket.onclose = function(event) {
            if (event.wasClean) {
                console.log(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
            } else {
                console.log('[close] Connection died');
            }
        };

        socket.onerror = function(error) {
            console.log(`[error] ${error.eventPhase}`);
        };
    }
}

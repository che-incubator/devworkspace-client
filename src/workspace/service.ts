/**********************************************************************
 * Copyright (c) 2021 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 ***********************************************************************/

import * as k8s from '@kubernetes/client-node';
import { createCluster, createUser } from '../kubeconfig';
import fetch from 'node-fetch';
import { IncomingMessage } from 'http';
import { handleCreationErrors, handleGenericError } from './errors';

export interface IStatusUpdate {
    error?: string;
    status?: string;
    prevStatus?: string;
    workspaceId: string;
}

export class DevWorkspaceService {

    private customObjectAPI: k8s.CustomObjectsApi | undefined;
    private watchAPI: k8s.Watch | undefined;
    private devworkspaceVersion: string;
    private group: string;
    private devworkspaceSubresource: string;
    private namespacesWatching: Map<string, any>;
    private expiryDate: Date | undefined;
    private keycloakURL: string | undefined;
    private tokenPromise: any;
    private keycloakAuthPath;

    // Map of namespace to workspaceId to status
    private previousItems: Map<string, Map<string, IStatusUpdate>>;

    constructor() {
        this.devworkspaceVersion = 'v1alpha2';
        this.group = 'workspace.devfile.io';
        this.devworkspaceSubresource = 'devworkspaces';
        this.keycloakAuthPath = '/auth/realms/che/broker/openshift-v4/token';
        this.namespacesWatching = new Map<string, string>();

        if (!('KEYCLOAKURL' in process.env)) {
            console.log('KEYCLOAKURL environment variable is required');
            process.exit(1);
        }

        const keycloak = process.env.KEYCLOAKURL as string;
        const keycloakEndTrimmed = keycloak.endsWith('/') ? keycloak.substr(-1) : keycloak;
        this.keycloakURL = keycloakEndTrimmed + this.keycloakAuthPath;
        this.previousItems = new Map();
    }

    async getAllWorkspaces(namespace: string, keycloakToken: string): Promise<any> {
        await this.refreshApi(keycloakToken);
        return this.customObjectAPI!.listNamespacedCustomObject(this.group, this.devworkspaceVersion, namespace, this.devworkspaceSubresource).then(({ response, body }) => {
            return (body as any).items;
        }).catch(({ response, body }) => handleGenericError(response));
    }

    async getWorkspaceByName(namespace: string, workspaceName: string, keycloakToken: string): Promise<{
        response: IncomingMessage;
        body: object;
    }> {
        await this.refreshApi(keycloakToken);
        return this.customObjectAPI!.getNamespacedCustomObject(this.group, this.devworkspaceVersion, namespace, 'devworkspaces', workspaceName
        );
    }

    async subscribeToNamespace(connection: any, namespace: string): Promise<any> {
        connection.socket.on('message', async (message: any) => {
            const parsedMessage = JSON.parse(message);
            const keycloakToken = parsedMessage.keycloakToken;
            if (keycloakToken) {
                await this.refreshApi(keycloakToken);
                if (this.namespacesWatching.has(namespace)) {
                    console.log('namespace is already being watched');
                    return;
                }
                const req = await this.watchAPI!.watch(`/apis/workspace.devfile.io/${this.devworkspaceVersion}/namespaces/${namespace}/devworkspaces`,
                    {
                        allowWatchBookmarks: true,
                    },
                    (type, apiObj, watchObj) => {
                        if (type === 'DELETED') {
                            apiObj.status.phase = 'DELETED';
                        } else if (apiObj.metadata.deletionTimestamp !== undefined) {
                            apiObj.status.phase = 'DELETING';
                        }
                        const statusUpdate = this.createStatusUpdate(apiObj);
                        connection.socket.send(JSON.stringify(statusUpdate));
                    },
                    // tslint:disable-next-line:no-empty
                    () => {},
                    (err: any) => {
                        console.log(err);
                    });
                this.namespacesWatching.set(namespace, req);
                return Promise.resolve(undefined);
            }
        });
        connection.socket.on('close', (_: any) => {
            this.namespacesWatching.delete(namespace);
        });
    }

    async createDevWorkspace(devfile: any, keycloakToken: string): Promise<any> {
        await this.refreshApi(keycloakToken);
        const namespace = devfile.metadata.namespace;
        return this.customObjectAPI!.createNamespacedCustomObject(this.group, this.devworkspaceVersion, devfile.metadata.namespace, 'devworkspaces', devfile).catch(({ response, body }) => {
            return handleCreationErrors(response, namespace);
        });
    }

    async deleteDevWorkspace(namespace: string, workspaceName: string, keycloakToken: string): Promise<any> {
        await this.refreshApi(keycloakToken);
        return this.customObjectAPI!.deleteNamespacedCustomObject(this.group, this.devworkspaceVersion, namespace, 'devworkspaces', workspaceName).catch(({ response, body }) => handleGenericError(response));
    }

    async changeDevWorkspaceStatus(namespace: string, workspaceName: string, started: boolean, keycloakToken: string): Promise<any> {
        await this.refreshApi(keycloakToken);
        const patch = [
            {
                'op': 'replace',
                'path': '/spec/started',
                'value': started
            }
        ];
        const options = {
            headers: {
                'Content-type': k8s.PatchUtils.PATCH_FORMAT_JSON_PATCH
            }
        };
        return this.customObjectAPI!.patchNamespacedCustomObject(this.group, this.devworkspaceVersion, namespace, 'devworkspaces', workspaceName, patch, undefined, undefined, undefined, options).catch(({ response, body }) => handleGenericError(response));
    }

    /**
     * Grab the users OpenShift token from keycloak, log in, and refresh the kubernetes client node libraries to use
     * the OpenShift token
     * @param keycloakToken The users keycloak token
     */
    private async refreshApi(keycloakToken: string): Promise<void> {
        const currentDate = new Date();
        if (this.tokenPromise) {
            return this.tokenPromise;
        }
        if (this.keycloakURL && (!this.expiryDate || currentDate.getTime() > this.expiryDate.getTime())) {
            this.tokenPromise = new Promise((resolve, reject) => {
                fetch(this.keycloakURL as string, {
                    headers: {
                        'Authorization': keycloakToken
                    }
                }).then(async resp => {
                    if (!resp.ok) {
                        console.error('Keycloak OpenShift token request failed.', resp.statusText);
                        return;
                    }
                    const token = await resp.json();
                    const expired = token.expires_in; // the unit it seconds. defaults to 86400 seconds or 24 hours
                    this.expiryDate = new Date(currentDate.getTime() + (expired * 1000));
                    this.refreshKubeConfig(token.access_token);
                    resolve(undefined);
                });
            });
            return this.tokenPromise;
        }
    }

    /**
     * Create a new kubernetes client node configuration that is logged in with the users OpenShift token
     * @param openshiftToken The users OpenShift token
     */
    private refreshKubeConfig(openshiftToken: string) {
        const kc = new k8s.KubeConfig();
        kc.loadFromClusterAndUser(createCluster(), createUser(openshiftToken));
        this.customObjectAPI = kc.makeApiClient(k8s.CustomObjectsApi);
        this.watchAPI = new k8s.Watch(kc);
    }

    /**
     * Create a status update between the previously recieving DevWorkspace with a certain workspace id
     * and the new DevWorkspace
     * @param devworkspace The incoming DevWorkspace
     */
    private createStatusUpdate(devworkspace: any): IStatusUpdate {
        const namespace = devworkspace.metadata.namespace;
        const workspaceId = devworkspace.status.workspaceId;
        const status = devworkspace.status.phase.toUpperCase();

        const prevWorkspace = this.previousItems.get(namespace);
        if (prevWorkspace) {
            const prevStatus = prevWorkspace.get(workspaceId);
            let newUpdate: IStatusUpdate = {
                workspaceId: workspaceId,
                status: status,
                prevStatus: prevStatus?.status
            };
            this.previousItems.get(namespace)?.set(workspaceId, newUpdate);
            return newUpdate;
        } else {
            // there is not a previous update
            const newStatus: IStatusUpdate = {
                workspaceId,
                status: status,
                prevStatus: status
            };

            const newStatusMap = new Map<string, IStatusUpdate>();
            newStatusMap.set(workspaceId, newStatus);
            this.previousItems.set(namespace, newStatusMap);
            return newStatus;
        }
    }
}

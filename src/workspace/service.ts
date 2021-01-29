/*********************************************************************
 * Copyright (c) 2018 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 **********************************************************************/
import * as k8s from '@kubernetes/client-node';
import { FastifyReply } from 'fastify';
import { createCluster, createUser } from '../kubeconfig';
import fetch from 'node-fetch';
import { Writable } from 'stream';
import { IncomingMessage } from 'http';
import { watch } from 'fs';

export interface IStatusUpdate {
    error?: string;
    status?: string;
    prevStatus?: string;
    workspaceId: string;
}

export class DevWorkspaceService {

    private customObjectAPI: k8s.CustomObjectsApi | undefined;
    private watchAPI: k8s.Watch | undefined;
    private logsApi: k8s.Log | undefined;
    private devworkspaceVersion: string;
    private group: string;
    private devworkspaceSubresource: string;
    private namespacesWatching: Map<string, any>;
    private expiryDate: Date | undefined;
    private keycloakURL: string | undefined;
    private tokenPromise: any;

    // Map of namespace to workspaceId to status
    private previousItems: Map<string, Map<string, IStatusUpdate>>;

    constructor() {
        this.devworkspaceVersion = 'v1alpha2';
        this.group = 'workspace.devfile.io';
        this.devworkspaceSubresource = 'devworkspaces';
        this.namespacesWatching = new Map<string, string>();

        this.keycloakURL = process.env.KEYCLOAKURL;
        this.previousItems = new Map();
    }

    async getAllWorkspaces(namespace: string, keycloakToken: string): Promise<any> {
        await this.refreshApi(keycloakToken);
        return this.customObjectAPI!.listNamespacedCustomObject(this.group, this.devworkspaceVersion, namespace, this.devworkspaceSubresource).then(({ response, body }) => {
            return (body as any).items;
        }).catch(e => console.log(e));
    }

    async getWorkspaceByName(namespace: string, workspaceName: string, keycloakToken: string): Promise<{
        response: IncomingMessage;
        body: object;
    }> {
        await this.refreshApi(keycloakToken);
        return this.customObjectAPI!.getNamespacedCustomObject(this.group, this.devworkspaceVersion, namespace, 'devworkspaces', workspaceName);
    }

    async subscribeToNamespace(connection: any, namespace: string): Promise<any> {
        connection.socket.on('message', async (message: any) => {
            const parsedMessage = JSON.parse(message);
            const token = parsedMessage.keycloakToken;
            if (token) {
                await this.refreshApi(token);
                if (this.namespacesWatching.has(namespace)) {
                    return;
                }
                const req = await this.watchAPI!.watch(`/apis/workspace.devfile.io/${this.devworkspaceVersion}/namespaces/${namespace}/devworkspaces`,
                    {
                        allowWatchBookmarks: true,
                    },
                    (type, apiObj, watchObj) => {
                        console.log(type);
                        console.log(apiObj);
                        console.log(watchObj);
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
    }

    async unsubscribeFromNamespace(namespace: string): Promise<any> {
        const req = this.namespacesWatching.get(namespace);
        if (req) {
            req.abort();
            this.namespacesWatching.delete(namespace);
        }
    }

    async createNamespace(namespace: string, keycloakToken: string): Promise<any> {
        await this.refreshApi(keycloakToken);
        // User cannot create namespace. Works when loading from default
        // const openshiftRestClient = require('openshift-rest-client').OpenshiftClient;
        // console.log('attempting to create client');
        // const client = await openshiftRestClient({ });
        // console.log('attempting to create namespace');
        // client.apis['project.openshift.io'].v1.project.post( { body: {
        //     metadata: {
        //         name: 'sample'
        //     }
        // }}).then((response: any) => {
        //     console.log(response.body);
        // });
        // console.log('finished to create client');
        try {
            // return await corev1.createNamespace({
            //     metadata: {
            //         name: namespace
            //     }
            // });
        } catch (e) {
            // noop
        }
    }

    async create(devfileStringified: any, keycloakToken: string): Promise<any> {
        await this.refreshApi(keycloakToken);
        const devfile = JSON.parse(devfileStringified);
        console.log(devfile);
        return this.customObjectAPI!.createNamespacedCustomObject(this.group, this.devworkspaceVersion, devfile.metadata.namespace, 'devworkspaces', devfile);
    }

    async delete(namespace: string, workspaceName: string, keycloakToken: string): Promise<any> {
        await this.refreshApi(keycloakToken);
        return this.customObjectAPI!.deleteNamespacedCustomObject(this.group, this.devworkspaceVersion, namespace, 'devworkspaces', workspaceName);
    }

    async changeWorkspaceStatus(namespace: string, workspaceName: string, started: boolean, keycloakToken: string): Promise<any> {
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
        return this.customObjectAPI!.patchNamespacedCustomObject(this.group, this.devworkspaceVersion, namespace, 'devworkspaces', workspaceName, patch, undefined, undefined, undefined, options);
    }

    private async refreshApi(keycloakToken: string): Promise<void> {
        // if expired then refresh
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

    private refreshKubeConfig(token: string) {
        const kc = new k8s.KubeConfig();
        console.log('creating a user');
        console.log(token);
        kc.loadFromClusterAndUser(createCluster(), createUser(token));
        this.customObjectAPI = kc.makeApiClient(k8s.CustomObjectsApi);
        this.watchAPI = new k8s.Watch(kc);
        this.logsApi = new k8s.Log(kc);
    }

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

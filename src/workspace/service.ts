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

export class DevWorkspaceService {

    private customObjectAPI: k8s.CustomObjectsApi | undefined;
    private watchAPI: k8s.Watch | undefined;
    private coreAPI: k8s.CoreV1Api | undefined;
    private devworkspaceVersion: string;
    private group: string;
    private devworkspaceSubresource: string;
    private namespacesWatching: Map<string, any>;
    private expiryDate: Date | undefined;
    private keycloakURL: string | undefined;
    private updatingToken: boolean;
    private tokenPromise: any;

    constructor() {
        this.devworkspaceVersion = 'v1alpha2';
        this.group = 'workspace.devfile.io';
        this.devworkspaceSubresource = 'devworkspaces';
        this.namespacesWatching = new Map<string, string>();

        this.keycloakURL = process.env.KEYCLOAKURL;
        this.updatingToken = false;
    }

    async getAllWorkspaces(namespace: string, keycloakToken: string): Promise<any> {
        await this.refreshApi(keycloakToken);
        return this.customObjectAPI!.listNamespacedCustomObject(this.group, this.devworkspaceVersion, namespace, this.devworkspaceSubresource).then(({ response, body }) => {
            return (body as any).items;
        });
    }

    async getWorkspaceByName(namespace: string, workspaceName: string, keycloakToken: string): Promise<any> {
        await this.refreshApi(keycloakToken);
        return this.customObjectAPI!.getNamespacedCustomObject(this.group, this.devworkspaceVersion, namespace, 'devworkspaces', workspaceName);
    }

    async subscribeToNamespace(connection: any, namespace: string): Promise<any> {
        console.log('setting up connection');
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
                        // console.log(connection.socket);
                        connection.socket.send(JSON.stringify(apiObj));
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

    async unsubscribeFromNamespace(namespace: string, token: string): Promise<any> {
        const req = this.namespacesWatching.get(namespace);
        if (req) {
            req.abort();
            this.namespacesWatching.delete(namespace);
        }
    }

    async createNamespace(namespace: string, keycloakToken: string): Promise<any> {
        await this.refreshApi(keycloakToken);
        // User cannot create namespace. Works when loading from default
        const kc = new k8s.KubeConfig();
        kc.loadFromDefault();
        const corev1 = kc.makeApiClient(k8s.CoreV1Api);
        try {
            return await corev1.createNamespace({
                metadata: {
                    name: namespace
                }
            });
        } catch (e) {
            // noop
        }
    }

    async create(devfile: any, keycloakToken: string): Promise<any> {
        await this.refreshApi(keycloakToken);
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
                    console.log('wat');
                    resolve(undefined);
                });
            });
            return this.tokenPromise;
        }
    }

    private refreshKubeConfig(token: string) {
        const kc = new k8s.KubeConfig();
        kc.loadFromClusterAndUser(createCluster(), createUser(token));
        this.customObjectAPI = kc.makeApiClient(k8s.CustomObjectsApi);
        this.watchAPI = new k8s.Watch(kc);
        this.coreAPI = kc.makeApiClient(k8s.CoreV1Api);
    }
}

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

export class DevWorkspaceService {

    private customObjectAPI: k8s.CustomObjectsApi;
    private watchAPI: k8s.Watch;
    private coreAPI: k8s.CoreV1Api;
    private devworkspaceVersion: string;
    private group: string;
    private devworkspaceSubresource: string;
    private namespacesWatching: Map<string, any>;

    constructor() {
        const kc = new k8s.KubeConfig();
        kc.loadFromDefault();
        this.customObjectAPI = kc.makeApiClient(k8s.CustomObjectsApi);
        this.watchAPI = new k8s.Watch(kc);
        this.coreAPI = kc.makeApiClient(k8s.CoreV1Api);
        this.devworkspaceVersion = 'v1alpha2';
        this.group = 'workspace.devfile.io';
        this.devworkspaceSubresource = 'devworkspaces';
        this.namespacesWatching = new Map<string, string>();
    }

    getAllWorkspaces(namespace: string): Promise<any> {
        const options = { 'headers': { 'Authentication': 'Bearer TOKEN'}};
        console.log(options);
        return this.customObjectAPI.listNamespacedCustomObject(this.group, this.devworkspaceVersion, namespace, this.devworkspaceSubresource, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, options).then(({ response, body }) => {
            return (body as any).items;
        });
    }

    getWorkspaceByName(namespace: string, workspaceName: string): Promise<any> {
        return this.customObjectAPI.getNamespacedCustomObject(this.group, this.devworkspaceVersion, namespace, 'devworkspaces', workspaceName);
    }

    async subscribeToNamespace(namespace: string, reply: FastifyReply): Promise<any> {
        if (this.namespacesWatching.has(namespace)) {
            return;
        }
        const req = await this.watchAPI.watch(`/apis/workspace.devfile.io/${this.devworkspaceVersion}/namespaces/${namespace}/devworkspaces`,
            {
                allowWatchBookmarks: true,
            },
            (type, apiObj, watchObj) => {
                console.log(type);
                console.log(apiObj);
                console.log(watchObj);
                reply.send(apiObj);
            },
            // tslint:disable-next-line:no-empty
            () => {},
            (err: any) => {
                console.log(err);
            });
        console.log(req);
        this.namespacesWatching.set(namespace, req);
        return Promise.resolve(undefined);
    }

    async unsubscribeFromNamespace(namespace: string): Promise<any> {
        const req = this.namespacesWatching.get(namespace);
        if (req) {
            req.abort();
            this.namespacesWatching.delete(namespace);
        }
    }

    createNamespace(namespace: string): Promise<any> {
        return this.coreAPI.createNamespace({
            metadata: {
                namespace
            }
        });
    }

    create(devfile: any): Promise<any> {
        return this.customObjectAPI.createNamespacedCustomObject(this.group, this.devworkspaceVersion, devfile.metadata.namespace, 'devworkspaces', devfile);
    }

    delete(namespace: string, workspaceName: string): Promise<any> {
        return this.customObjectAPI.deleteNamespacedCustomObject(this.group, this.devworkspaceVersion, namespace, 'devworkspaces', workspaceName);
    }

    async changeWorkspaceStatus(namespace: string, workspaceName: string, started: boolean): Promise<any> {
        const patch = [
            {
                'op': 'replace',
                'path': '/spec/started',
                'value': started
            }
        ];
        const options = { 'headers': { 'Content-type': k8s.PatchUtils.PATCH_FORMAT_JSON_PATCH}};
        return await this.customObjectAPI.patchNamespacedCustomObject(this.group, this.devworkspaceVersion, namespace, 'devworkspaces', workspaceName, patch, undefined, undefined, undefined, options);
    }
}

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

export class DevWorkspaceService {

    private customObjectAPI: k8s.CustomObjectsApi;
    private devworkspaceVersion: string;
    private group: string;
    private devworkspaceSubresource: string;

    constructor() {
        const kc = new k8s.KubeConfig();
        kc.loadFromDefault();
        this.customObjectAPI = kc.makeApiClient(k8s.CustomObjectsApi);
        this.devworkspaceVersion = 'v1alpha2';
        this.group = 'workspace.devfile.io';
        this.devworkspaceSubresource = 'devworkspaces';
    }

    getAllWorkspaces(): Promise<any> {
        console.log('updated');
        return this.customObjectAPI.listNamespacedCustomObject(this.group, this.devworkspaceVersion, 'sample', this.devworkspaceSubresource).then(({ response, body }) => {
            return (body as any).items;
        });
    }

    getWorkspaceById(workspaceId: string): Promise<any> {
        console.log(workspaceId);
        return this.getAllWorkspaces().then(workspaces => {
            // find the one with the correct workspace ID
            let foundWorkspace;
            workspaces.forEach((workspace: any) => {
                if (workspace.status.workspaceId === workspaceId) {
                    foundWorkspace = workspace;
                }
            });
            return foundWorkspace;
        }).catch(e => {
            return e;
        });
    }

    subscribeToNamespace(): Promise<any> {
        this.customObjectAPI.getNamespacedCustomObjectStatus(this.group, this.devworkspaceVersion, 'sample', 'devworkspaces', 'test');
        return Promise.resolve(undefined);
    }

    create(devfile: any): Promise<any> {
        return this.customObjectAPI.createNamespacedCustomObject(this.group, this.devworkspaceVersion, 'sample', 'devworkspaces', devfile);
    }

    async changeWorkspaceStatus(workspaceId: string, started: boolean): Promise<any> {
        const workspace = await this.getWorkspaceById(workspaceId);
        workspace.spec.started = started;
        return this.customObjectAPI.patchNamespacedCustomObject(this.group, this.devworkspaceVersion, 'sample', 'devworkspaces', 'test', workspace);
    }

}

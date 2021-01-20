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

    constructor() {
        const kc = new k8s.KubeConfig();
        kc.loadFromDefault();
        this.customObjectAPI = kc.makeApiClient(k8s.CustomObjectsApi);
        this.devworkspaceVersion = 'v1alpha2';
    }

    getAllWorkspaces(): Promise<any> {
        return this.customObjectAPI.listNamespacedCustomObject('workspace.devfile.io', this.devworkspaceVersion, 'sample', 'devworkspaces');
    }

    getWorkspaceById(workspaceId: string): Promise<any> {
        console.log(workspaceId);
        const c = this.customObjectAPI.listNamespacedCustomObject('workspace.devfile.io', this.devworkspaceVersion, 'sample', 'devworkspaces');
        return c.then(e => {
            // find the one with the correct workspace ID
            return e;
        }).catch(e => {
            return e;
        });
    }

    subscribeToWorkspaceStatus(): Promise<any> {
        return Promise.resolve(undefined);
    }

}

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
import { injectable } from 'inversify';
import { NodeRequestError } from './errors';
import { devWorkspaceApiGroup, devworkspaceTemplateSubresource, devworkspaceVersion } from '../common';
import {
    IDevWorkspaceTemplate,
    IDevWorkspaceTemplateApi,
} from '../types';

@injectable()
export class NodeDevWorkspaceTemplateApi implements IDevWorkspaceTemplateApi {
    private customObjectAPI!: k8s.CustomObjectsApi;

    set config(kc: k8s.KubeConfig) {
        this.customObjectAPI = kc.makeApiClient(k8s.CustomObjectsApi);
    }

    async listInNamespace(namespace: string): Promise<IDevWorkspaceTemplate[]> {
        try {
            const resp = await this.customObjectAPI.listNamespacedCustomObject(
                devWorkspaceApiGroup,
                devworkspaceVersion,
                namespace,
                devworkspaceTemplateSubresource
            );
            return (resp.body as any).items as IDevWorkspaceTemplate[];
        } catch (e) {
            return Promise.reject(new NodeRequestError(e));
        }
    }

    async getByName(namespace: string, workspaceName: string): Promise<IDevWorkspaceTemplate> {
        try {
            const resp = await this.customObjectAPI.getNamespacedCustomObject(
                devWorkspaceApiGroup,
                devworkspaceVersion,
                namespace,
                devworkspaceTemplateSubresource,
                workspaceName
            );
            return resp.body as IDevWorkspaceTemplate;
        } catch (e) {
            return Promise.reject(new NodeRequestError(e));
        }
    }

    async create(
        devworkspaceTemplate: IDevWorkspaceTemplate,
    ): Promise<IDevWorkspaceTemplate> {
        try {
            const namespace = devworkspaceTemplate.metadata.namespace;
            const resp = await this.customObjectAPI.createNamespacedCustomObject(
                devWorkspaceApiGroup,
                devworkspaceVersion,
                namespace,
                devworkspaceTemplateSubresource,
                devworkspaceTemplate
            );
            return resp.body as IDevWorkspaceTemplate;
        } catch (e) {
            return Promise.reject(new NodeRequestError(e));
        }
    }

    async delete(namespace: string, name: string): Promise<void> {
        try {
            this.customObjectAPI.deleteNamespacedCustomObject(
                devWorkspaceApiGroup,
                devworkspaceVersion,
                namespace,
                devworkspaceTemplateSubresource,
                name
            );
        } catch (e) {
            return Promise.reject(new NodeRequestError(e));
        }
    }
}

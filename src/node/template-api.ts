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
import { V1alpha2DevWorkspaceTemplate } from '@devfile/api';
import { IDevWorkspaceTemplateApi } from '../types';

@injectable()
export class NodeDevWorkspaceTemplateApi implements IDevWorkspaceTemplateApi {
    private customObjectAPI!: k8s.CustomObjectsApi;

    set config(kc: k8s.KubeConfig) {
        this.customObjectAPI = kc.makeApiClient(k8s.CustomObjectsApi);
    }

    async listInNamespace(namespace: string): Promise<V1alpha2DevWorkspaceTemplate[]> {
        try {
            const resp = await this.customObjectAPI.listNamespacedCustomObject(
                devWorkspaceApiGroup,
                devworkspaceVersion,
                namespace,
                devworkspaceTemplateSubresource
            );
            return (resp.body as any).items as V1alpha2DevWorkspaceTemplate[];
        } catch (e) {
            return Promise.reject(new NodeRequestError(e));
        }
    }

    async getByName(namespace: string, name: string): Promise<V1alpha2DevWorkspaceTemplate> {
        try {
            const resp = await this.customObjectAPI.getNamespacedCustomObject(
                devWorkspaceApiGroup,
                devworkspaceVersion,
                namespace,
                devworkspaceTemplateSubresource,
                name
            );
            return resp.body as V1alpha2DevWorkspaceTemplate;
        } catch (e) {
            return Promise.reject(new NodeRequestError(e));
        }
    }

    async create(
        devworkspaceTemplate: V1alpha2DevWorkspaceTemplate,
    ): Promise<V1alpha2DevWorkspaceTemplate> {
        try {
            const resp = await this.customObjectAPI.createNamespacedCustomObject(
                devWorkspaceApiGroup,
                devworkspaceVersion,
                devworkspaceTemplate.metadata?.namespace || '',
                devworkspaceTemplateSubresource,
                devworkspaceTemplate
            );
            return resp.body as V1alpha2DevWorkspaceTemplate;
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

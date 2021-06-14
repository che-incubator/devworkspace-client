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
import { V1alpha2DevWorkspace, V220Devfile } from '@devfile/api';
import {
  IDevWorkspaceApi,
  Patch,
} from '../types';
import {
  devworkspacePluralSubresource,
  devworkspaceVersion,
  devWorkspaceApiGroup,
} from '../common';
import { injectable } from 'inversify';
import { NodeRequestError } from './errors';

@injectable()
export class NodeDevWorkspaceApi implements IDevWorkspaceApi {
  private customObjectAPI!: k8s.CustomObjectsApi;

  set config(kc: k8s.KubeConfig) {
    this.customObjectAPI = kc.makeApiClient(k8s.CustomObjectsApi);
  }

  async listInNamespace(namespace: string): Promise<V1alpha2DevWorkspace[]> {
    try {
      const resp = await this.customObjectAPI.listNamespacedCustomObject(
        devWorkspaceApiGroup,
        devworkspaceVersion,
        namespace,
        devworkspacePluralSubresource
      );
      return (resp.body as any).items as V1alpha2DevWorkspace[];
    } catch (e) {
      return Promise.reject(new NodeRequestError(e));
    }
  }

  async getByName(
    namespace: string,
    name: string
  ): Promise<V1alpha2DevWorkspace> {
    try {
      const resp = await this.customObjectAPI.getNamespacedCustomObject(
        devWorkspaceApiGroup,
        devworkspaceVersion,
        namespace,
        devworkspacePluralSubresource,
        name
      );
      return resp.body as V1alpha2DevWorkspace;
    } catch (e) {
      return Promise.reject(new NodeRequestError(e));
    }
  }

  async create(
    devworkspace: V1alpha2DevWorkspace
  ): Promise<V1alpha2DevWorkspace> {
    try {
      const resp = await this.customObjectAPI.createNamespacedCustomObject(
        devWorkspaceApiGroup,
        devworkspaceVersion,
        devworkspace.metadata?.namespace || '',
        devworkspacePluralSubresource,
        devworkspace
      );
      return resp.body as V1alpha2DevWorkspace;
    } catch (e) {
      return Promise.reject(new NodeRequestError(e));
    }
  }

  async update(devworkspace: V1alpha2DevWorkspace): Promise<V1alpha2DevWorkspace> {
    try {
      // You have to delete some elements from the devworkspace in order to update
      const metadata = devworkspace.metadata || {};
      if (metadata?.uid) {
        metadata.uid = undefined;
      }
      if (metadata.creationTimestamp) {
        delete metadata.creationTimestamp;
      }
      if (metadata.deletionTimestamp) {
        delete metadata.deletionTimestamp;
      }

      const resp = await this.customObjectAPI.replaceNamespacedCustomObject(
        devWorkspaceApiGroup,
        devworkspaceVersion,
        metadata?.namespace || '',
        devworkspacePluralSubresource,
        metadata?.name || '',
        devworkspace
      )
      return resp.body as V1alpha2DevWorkspace;
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
        devworkspacePluralSubresource,
        name
      );
    } catch (e) {
      return Promise.reject(new NodeRequestError(e));
    }
  }

  /**
   * Patch a devworkspace
   * @param devworkspace The devworkspace you want to patch
   */
  async patch(namespace: string, name: string, patches: Patch[]): Promise<V1alpha2DevWorkspace> {
    return this.createPatch(namespace, name, patches);
  }

  async changeStatus(
    namespace: string,
    name: string,
    started: boolean
  ): Promise<V1alpha2DevWorkspace> {
    return this.createPatch(namespace, name, [{
      op: 'replace',
      path: '/spec/started',
      value: started
    }]);
  }

  private async createPatch(
    namespace: string,
    name: string,
    patches: Patch[]) {
    try {
      const options = {
        headers: {
          'Content-type': k8s.PatchUtils.PATCH_FORMAT_JSON_PATCH,
        },
      };
      const resp = await this.customObjectAPI.patchNamespacedCustomObject(
        devWorkspaceApiGroup,
        devworkspaceVersion,
        namespace,
        devworkspacePluralSubresource,
        name,
        patches,
        undefined,
        undefined,
        undefined,
        options
      );
      return resp.body as V1alpha2DevWorkspace;
    } catch (e) {
      return Promise.reject(new NodeRequestError(e));
    }
  }
}

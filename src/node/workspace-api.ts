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
import {
  IDevWorkspace,
  IDevWorkspaceApi,
  IDevWorkspaceDevfile,
} from '../types';
import {
  devworkspacePluralSubresource,
  devworkspaceVersion,
  devWorkspaceApiGroup,
} from '../common';
import { handleGenericError } from './errors';
import { devfileToDevWorkspace } from '../common/converter';
import { injectable } from 'inversify';

@injectable()
export class NodeDevWorkspaceApi implements IDevWorkspaceApi {
  private customObjectAPI!: k8s.CustomObjectsApi;

  set config(kc: k8s.KubeConfig) {
    this.customObjectAPI = kc.makeApiClient(k8s.CustomObjectsApi);
  }

  async listInNamespace(namespace: string): Promise<IDevWorkspace[]> {
    try {
      const resp = await this.customObjectAPI.listNamespacedCustomObject(
        devWorkspaceApiGroup,
        devworkspaceVersion,
        namespace,
        devworkspacePluralSubresource
      );
      return (resp.body as any).items as IDevWorkspace[];
    } catch (e) {
      throw handleGenericError(e);
    }
  }

  async getByName(
    namespace: string,
    workspaceName: string
  ): Promise<IDevWorkspace> {
    try {
      const resp = await this.customObjectAPI.getNamespacedCustomObject(
        devWorkspaceApiGroup,
        devworkspaceVersion,
        namespace,
        devworkspacePluralSubresource,
        workspaceName
      );
      return resp.body as IDevWorkspace;
    } catch (e) {
      throw handleGenericError(e);
    }
  }

  async create(
    devfile: IDevWorkspaceDevfile,
    routingClass: string,
    started: boolean = true
  ): Promise<IDevWorkspace> {
    try {
      const devworkspace = devfileToDevWorkspace(devfile, routingClass, started);
      const namespace = devfile.metadata.namespace;
      const resp = await this.customObjectAPI.createNamespacedCustomObject(
        devWorkspaceApiGroup,
        devworkspaceVersion,
        namespace,
        devworkspacePluralSubresource,
        devworkspace
      );
      return resp.body as IDevWorkspace;
    } catch (e) {
      throw handleGenericError(e);
    }
  }

  async update(devworkspace: IDevWorkspace): Promise<IDevWorkspace> {
    try {
      // You have to delete some elements from the devworkspace in order to update
      if (devworkspace.metadata?.uid) {
        devworkspace.metadata.uid = undefined;
      }
      if (devworkspace.metadata.creationTimestamp) {
        delete devworkspace.metadata.creationTimestamp;
      }
      if (devworkspace.metadata.deletionTimestamp) {
        delete devworkspace.metadata.deletionTimestamp;
      }

      const name = devworkspace.metadata.name;
      const namespace = devworkspace.metadata.namespace;

      const resp = await this.customObjectAPI.replaceNamespacedCustomObject(
        devWorkspaceApiGroup,
        devworkspaceVersion,
        namespace,
        devworkspacePluralSubresource,
        name,
        devworkspace
      )
      return resp.body as IDevWorkspace;
    } catch (e) {
      console.log(e);
      throw handleGenericError(e);
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
      throw handleGenericError(e);
    }
  }

  async changeStatus(
    namespace: string,
    name: string,
    started: boolean
  ): Promise<IDevWorkspace> {
    try {
      const patch = [
        {
          op: 'replace',
          path: '/spec/started',
          value: started,
        },
      ];
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
        patch,
        undefined,
        undefined,
        undefined,
        options
      );
      return resp.body as IDevWorkspace;
    } catch (e) {
      throw handleGenericError(e);
    }
  }
}

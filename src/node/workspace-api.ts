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
import { IDevWorkspace, IDevWorkspaceDevfile, IKubernetesGroupsModel } from '../types';
import { devfileToDevWorkspace, IDevWorkspaceApi } from '../index';
import {
  devworkspaceSubresource,
  devworkspaceVersion,
  group,
  openshiftIdentifier,
} from '../common';
import { projectRequestModel } from '../common/models';
import { handleGenericError } from './errors';
import { isDevelopmentEnabled } from '../common/helper';
// tslint:disable-next-line:no-var-requires
const openshiftRestClient = require('openshift-rest-client').OpenshiftClient;

export class NodeDevWorkspaceApi implements IDevWorkspaceApi {
  private customObjectAPI: k8s.CustomObjectsApi;

  constructor() {
    const kc = new k8s.KubeConfig();
    if (isDevelopmentEnabled()) {
      kc.loadFromDefault();
    } else {
      kc.loadFromCluster();
    }
    this.customObjectAPI = kc.makeApiClient(k8s.CustomObjectsApi);
  }

  async getAllWorkspaces(defaultNamespace: string): Promise<IDevWorkspace[]> {
    try {
      const resp = await this.customObjectAPI.listNamespacedCustomObject(
        group,
        devworkspaceVersion,
        defaultNamespace,
        devworkspaceSubresource
      );
      return (resp.body as any).items as IDevWorkspace[];
    } catch (e) {
      throw handleGenericError(e);
    }
  }

  async getWorkspaceByName(
    namespace: string,
    workspaceName: string
  ): Promise<IDevWorkspace> {
    try {
      const resp = await this.customObjectAPI.getNamespacedCustomObject(
        group,
        devworkspaceVersion,
        namespace,
        devworkspaceSubresource,
        workspaceName
      );
      return resp.body as IDevWorkspace;
    } catch (e) {
      throw handleGenericError(e);
    }
  }

  async create(
    devfile: IDevWorkspaceDevfile,
    defaultEditor?: string,
    defaultPlugins?: string[]
  ): Promise<IDevWorkspace> {
    try {
      const devworkspace = devfileToDevWorkspace(devfile);
      const namespace = devfile.metadata.namespace;
      const resp = await this.customObjectAPI.createNamespacedCustomObject(
        group,
        devworkspaceVersion,
        namespace,
        devworkspaceSubresource,
        devworkspace
      );
      return resp.body as IDevWorkspace;
    } catch (e) {
      throw handleGenericError(e);
    }
  }

  async delete(namespace: string, name: string): Promise<void> {
    try {
      this.customObjectAPI.deleteNamespacedCustomObject(
        group,
        devworkspaceVersion,
        namespace,
        devworkspaceSubresource,
        name
      );
    } catch (e) {
      throw handleGenericError(e);
    }
  }

  async changeWorkspaceStatus(
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
        group,
        devworkspaceVersion,
        namespace,
        devworkspaceSubresource,
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

  async initializeNamespace(namespace: string): Promise<void> {
    const client = await openshiftRestClient();
    try {
      const isOpenShift = await this.isOpenShift(client);
      if (isOpenShift) {
        const doesProjectAlreadyExist = await this.doesProjectExist(client, namespace);
        if (!doesProjectAlreadyExist) {
          this.createProject(client, namespace);
        }
      }
    } catch (e) {
      console.log(e);
    }
  }

  async doesProjectExist(client: any, projectName: string): Promise<boolean> {
    try {
      const p = await client.apis[openshiftIdentifier].v1.projects.get();
      return p.body.items.filter((x: any) => x.metadata.name === projectName).length > 0;
    } catch (e) {
      return false;
    }
  }

  private createProject(client: any, namespace: string): void {
    try {
      client.apis[openshiftIdentifier].v1.projectrequests.post({ body: projectRequestModel(namespace) });
    } catch (e) {
      throw handleGenericError(e);
    }
  }

  async isApiEnabled(): Promise<boolean> {
      // the API is always available on node
      return Promise.resolve(true);
  }

  private async isOpenShift(client: any): Promise<boolean> {
      return this.findApi(client, openshiftIdentifier);
  }

  private async findApi(client: any, apiName: string): Promise<boolean> {
    try {
      const resp = await client.apis.get();
      const groups = await resp.body.groups;
      const filtered = groups.filter((x: IKubernetesGroupsModel) => x.name === apiName).length > 0;
      return Promise.resolve(filtered);
    } catch (e) {
      throw handleGenericError(e);
    }
  }
}

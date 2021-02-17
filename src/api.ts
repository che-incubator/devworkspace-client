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

import { AxiosInstance } from 'axios';
import {
  createKubernetesComponent,
  hasEditor,
  pluginsToInject,
} from './injector';
import { devfileToDevWorkspace } from './converter';
import { IDevWorkspace, IDevWorkspaceDevfile, IKubernetesGroupsModel } from './types';
import { delay } from './helper';
import { IDevWorkspaceApi } from './index';

export class DevWorkspaceApi implements IDevWorkspaceApi {
  private axios: AxiosInstance;
  private openshiftIdentifier = 'project.openshift.io';
  private devworkspaceIdentifier = 'workspace.devfile.io';
  private apiEnabled: boolean | undefined;
  private isOpenshiftCluster: boolean | undefined;

  constructor(axios: AxiosInstance) {
    this.axios = axios;
  }

  async getAllWorkspaces(defaultNamespace: string): Promise<IDevWorkspace[]> {
    const resp = await this.axios.get(
      `/apis/workspace.devfile.io/v1alpha2/namespaces/${defaultNamespace}/devworkspaces`
    );
    return resp.data.items;
  }

  async getWorkspaceByName(
    namespace: string,
    workspaceName: string
  ): Promise<IDevWorkspace> {
    const resp = await this.axios.get(
      `/apis/workspace.devfile.io/v1alpha2/namespaces/${namespace}/devworkspaces/${workspaceName}`
    );
    return resp.data;
  }

  async create(
    devfile: IDevWorkspaceDevfile,
    defaultEditor?: string,
    defaultPlugins?: string[]
  ): Promise<IDevWorkspace> {
    const devworkspace = devfileToDevWorkspace(devfile);

    if (defaultEditor && !hasEditor(devfile)) {
      devworkspace.spec.template.components.push(
        createKubernetesComponent(defaultEditor)
      );
    }

    const pluginsNeeded = defaultPlugins
      ? pluginsToInject(devfile, defaultPlugins)
      : [];
    if (pluginsNeeded.length > 0) {
      for (const plugin of pluginsNeeded) {
        devworkspace.spec.template.components.push(
          createKubernetesComponent(plugin)
        );
      }
    }

    const stringifiedDevWorkspace = JSON.stringify(devworkspace);

    const resp = await this.axios.post(
      `/apis/workspace.devfile.io/v1alpha2/namespaces/${devfile.metadata.namespace}/devworkspaces`,
      stringifiedDevWorkspace,
      {
        headers: {
          'content-type': 'application/json; charset=utf-8',
        },
      }
    );

    const responseData = await resp.data;
    const namespace = responseData.metadata.namespace;
    const name = responseData.metadata.name;

    // We need to wait until the devworkspace has a status property
    let found;
    let count = 0;
    while (count < 5 && !found) {
      const potentialWorkspace = await this.getWorkspaceByName(namespace, name);
      if (potentialWorkspace?.status) {
        found = potentialWorkspace;
      } else {
        count += 1;
        delay();
      }
    }
    if (!found) {
      throw new Error(
        `Was not able to find a workspace with name ${name} in namespace ${namespace}`
      );
    }
    return found;
  }

  async delete(namespace: string, name: string): Promise<void> {
    await this.axios.delete(
      `/apis/workspace.devfile.io/v1alpha2/namespaces/${namespace}/devworkspaces/${name}`
    );
  }

  async changeWorkspaceStatus(namespace: string, name: string, started: boolean): Promise<IDevWorkspace> {
    const patch = [
      {
        path: '/spec/started',
        op: 'replace',
        value: started,
      },
    ];

    const resp = await this.axios.patch(
      `/apis/workspace.devfile.io/v1alpha2/namespaces/${namespace}/devworkspaces/${name}`,
      patch,
      {
        headers: {
          'Content-type': 'application/json-patch+json',
        },
      }
    );
    return resp.data;
  }

  async initializeNamespace(namespace: string): Promise<void> {
    const isOpenShift = await this.isOpenShift();
    if (isOpenShift) {
      const doesProjectAlreadyExist = await this.doesProjectExist(namespace);
      if (!doesProjectAlreadyExist) {
        this.createProject(namespace);
      }
    }
  }

  private async doesProjectExist(projectName: string): Promise<boolean> {
    try {
      await this.axios.get(`/apis/project.openshift.io/v1/projects/${projectName}`);
      return true;
    } catch (e) {
      return false;
    }
  }

  private createProject(namespace: string): void {
    // todo add the current user to the role if we can. Do we even have access to the current user?
    this.axios.post('/apis/project.openshift.io/v1/projectrequests', {
      apiVersion: 'project.openshift.io/v1',
      kind: 'ProjectRequest',
      metadata: {
        name: namespace,
      },
    });
  }

  async isApiEnabled(): Promise<boolean> {
    if (this.apiEnabled !== undefined) {
      return Promise.resolve(this.apiEnabled);
    }
    this.apiEnabled = await this.findApi(this.devworkspaceIdentifier);
    return this.apiEnabled;
  }

  private async isOpenShift(): Promise<boolean> {
    if (this.isOpenshiftCluster !== undefined) {
      return Promise.resolve(this.isOpenshiftCluster);
    }
    this.isOpenshiftCluster = await this.findApi(this.openshiftIdentifier);
    return this.isOpenshiftCluster;
  }

  private async findApi(apiName: string): Promise<boolean> {
    const resp = await this.axios.get('/apis');
    const responseData = await resp.data.groups;
    return responseData.filter((x: IKubernetesGroupsModel) => x.name === apiName).length > 0;
  }
}

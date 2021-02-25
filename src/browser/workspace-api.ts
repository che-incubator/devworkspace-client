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
} from '../common/injector';
import { devfileToDevWorkspace } from '../common/converter';
import { IDevWorkspace, IDevWorkspaceDevfile } from '../types';
import { delay } from '../common/helper';
import { IDevWorkspaceApi } from '../index';
import { devworkspaceVersion, devWorkspaceApiGroup, projectApiGroup, devworkspaceSubresource, projectRequestId, projectsId } from '../common';
import { projectRequestModel } from '../common/models';
import { isOpenShiftCluster } from './helper';

export class RestDevWorkspaceApi implements IDevWorkspaceApi {
  private axios: AxiosInstance;
  private projectInitRequestTimeoutMs = 10000;
  private projectRequestDelay = 100;

  constructor(axios: AxiosInstance) {
    this.axios = axios;
  }

  async listInNamespace(namespace: string): Promise<IDevWorkspace[]> {
    const resp = await this.axios.get(
      `/apis/${devWorkspaceApiGroup}/${devworkspaceVersion}/namespaces/${namespace}/${devworkspaceSubresource}`
    );
    return resp.data.items;
  }

  async getByName(
    namespace: string,
    workspaceName: string
  ): Promise<IDevWorkspace> {
    const resp = await this.axios.get(
      `/apis/${devWorkspaceApiGroup}/${devworkspaceVersion}/namespaces/${namespace}/${devworkspaceSubresource}/${workspaceName}`
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
      `/apis/${devWorkspaceApiGroup}/${devworkspaceVersion}/namespaces/${devfile.metadata.namespace}/${devworkspaceSubresource}`,
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

    // we need to wait until the devworkspace has a status property
    let found;
    let count = 0;
    while (count < 5 && !found) {
      const potentialWorkspace = await this.getByName(namespace, name);
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
      `/apis/${devWorkspaceApiGroup}/${devworkspaceVersion}/namespaces/${namespace}/${devworkspaceSubresource}/${name}`
    );
  }

  async changeStatus(namespace: string, name: string, started: boolean): Promise<IDevWorkspace> {
    const patch = [
      {
        path: '/spec/started',
        op: 'replace',
        value: started,
      },
    ];

    const resp = await this.axios.patch(
      `/apis/${devWorkspaceApiGroup}/${devworkspaceVersion}/namespaces/${namespace}/${devworkspaceSubresource}/${name}`,
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
    const isOpenShift = await isOpenShiftCluster(this.axios);
    if (isOpenShift) {
      const doesProjectAlreadyExist = await this.doesProjectExist(namespace);
      if (!doesProjectAlreadyExist) {
        this.createProject(namespace);
        await this.waitForProjectToBeReady(namespace);
      }
    }
  }

  async doesProjectExist(projectName: string): Promise<boolean> {
    try {
      const projects = await this.axios.get(`/apis/${projectApiGroup}/v1/${projectsId}`);
      for (const proj of projects.data.items) {
        if (proj.metadata.name === projectName) {
          return true;
        }
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  private createProject(namespace: string): void {
    this.axios.post(`/apis/${projectApiGroup}/v1/${projectRequestId}`, projectRequestModel(namespace));
  }

  private async waitForProjectToBeReady(namespace: string): Promise<void> {
    let secondsAttempted = 0;
    let request = await this.doesProjectExist(namespace);
    while (secondsAttempted < this.projectInitRequestTimeoutMs && !request) {
      request = await this.doesProjectExist(namespace);
      await delay(this.projectRequestDelay);
      secondsAttempted += this.projectRequestDelay;
    }
    if (secondsAttempted === this.projectInitRequestTimeoutMs) {
      throw new Error(`Project ${namespace} could not be initialized in ${this.projectInitRequestTimeoutMs / 1000} seconds`);
    }
  }

}

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
import { delay } from '../common/helper';
import { namespaceResources, projectApiGroup, projectRequestResources, projectResources } from '../common';
import { namespaceModel, projectRequestModel } from '../common/models';
import { isOpenShiftCluster } from './helper';
import { ICheApi } from '../types';

export class RestCheApi implements ICheApi {
  private axios: AxiosInstance;
  private projectInitRequestTimeoutMs = 10000;
  private projectRequestDelayMs = 100;

  constructor(axios: AxiosInstance) {
    this.axios = axios;
  }

  set config(axios: AxiosInstance) {
    this.axios = axios;
  }

  async initializeNamespace(namespace: string): Promise<void> {
    const isOpenShift = await isOpenShiftCluster(this.axios);
    if (isOpenShift) {
      const doesProjectAlreadyExist = await this.doesProjectExist(namespace);
      if (!doesProjectAlreadyExist) {
        this.createProject(namespace);
        await this.waitForProjectToBeReady(namespace);
      }
    } else {
      const doesNamespaceExists = await this.doesNamespaceExist(namespace);
      if (!doesNamespaceExists) {
        this.createNamespace(namespace);
      }
    }
  }

  private async doesNamespaceExist(namespace: string): Promise<boolean> {
    try {
      const namespaces = await this.axios.get(`/api/v1/${namespaceResources}`);
      for (const n of namespaces.data.items) {
        if (n.metadata.name === namespace) {
          return true;
        }
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  private async doesProjectExist(projectName: string): Promise<boolean> {
    try {
      const projects = await this.axios.get(`/apis/${projectApiGroup}/v1/${projectResources}`);
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
    this.axios.post(`/apis/${projectApiGroup}/v1/${projectRequestResources}`, projectRequestModel(namespace));
  }

  private createNamespace(namespace: string): void {
    this.axios.post(`/api/v1/${namespaceResources}`, namespaceModel(namespace));
  }

  private async waitForProjectToBeReady(namespace: string): Promise<void> {
    let millisecondsAttempted = 0;
    let request = await this.doesProjectExist(namespace);
    while (millisecondsAttempted < this.projectInitRequestTimeoutMs && !request) {
      request = await this.doesProjectExist(namespace);
      await delay(this.projectRequestDelayMs);
      millisecondsAttempted += this.projectRequestDelayMs;
    }
    if (millisecondsAttempted >= this.projectInitRequestTimeoutMs) {
      throw new Error(`Project ${namespace} could not be initialized in ${this.projectInitRequestTimeoutMs / 1000} seconds`);
    }
  }

}

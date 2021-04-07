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
    ICheApi,
} from '../types';
import {
  projectApiGroup,
  projectRequestId,
  projectsId,
} from '../common';
import { projectRequestModel } from '../common/models';
import { findApi } from './helper';
import { injectable } from 'inversify';
import { NodeRequestError } from './errors';

@injectable()
export class NodeCheApi implements ICheApi {
  private customObjectAPI!: k8s.CustomObjectsApi;
  private apisApi!: k8s.ApisApi;

  set config(kc: k8s.KubeConfig) {
    this.customObjectAPI = kc.makeApiClient(k8s.CustomObjectsApi);
    this.apisApi = kc.makeApiClient(k8s.ApisApi);
  }

  async initializeNamespace(namespace: string): Promise<void> {
    try {
      const isOpenShift = await this.isOpenShift();
      if (isOpenShift) {
        const doesProjectAlreadyExist = await this.doesProjectExist(namespace);
        if (!doesProjectAlreadyExist) {
          this.createProject(namespace);
        }
      }
    } catch (e) {
      console.log(e);
    }
  }

  async doesProjectExist(projectName: string): Promise<boolean> {
    try {
      const resp = await this.customObjectAPI.listClusterCustomObject(projectApiGroup, 'v1', projectsId);
      const projectList = (resp.body as any).items;
      return (
        projectList.filter((x: any) => x.metadata.name === projectName)
          .length > 0
      );
    } catch (e) {
      return false;
    }
  }

  private async createProject(namespace: string): Promise<void> {
    try {
      await this.customObjectAPI.createClusterCustomObject(
        projectApiGroup,
        'v1',
        projectRequestId,
        projectRequestModel(namespace)
      );
    } catch (e) {
      return Promise.reject(new NodeRequestError(e));
    }
  }

  private async isOpenShift(): Promise<boolean> {
    try {
      return findApi(this.apisApi, projectApiGroup);
    } catch (e) {
      return false;
    }
  }
}

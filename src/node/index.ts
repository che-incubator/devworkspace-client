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
import { devWorkspaceApiGroup, devworkspaceVersion } from '../common';
import {
  ICheApi,
  IDevWorkspaceApi,
  IDevWorkspaceClientApi,
  IDevWorkspaceTemplateApi,
  INodeConfig,
} from '../types';
import { NodeCheApi } from './che-api';
import { findApi, isInCluster } from './helper';
import { NodeDevWorkspaceTemplateApi } from './template-api';
import { NodeDevWorkspaceApi } from './workspace-api';

export class NodeApi implements IDevWorkspaceClientApi {
  private _workspaceApi: IDevWorkspaceApi;
  private _templateApi: IDevWorkspaceTemplateApi;
  private _cheApi: ICheApi;
  private apisApi: k8s.ApisApi;
  private apiEnabled: boolean | undefined;

  constructor(config: INodeConfig) {
    const kc = new k8s.KubeConfig();
    if (config.inCluster) {
      if (!isInCluster()) {
        throw new Error(
          'Recieved error message when attempting to load authentication from cluster. Most likely you are not running inside of a container.'
        );
      }
      kc.loadFromCluster();
    } else {
      kc.loadFromDefault();
    }
    this._workspaceApi = new NodeDevWorkspaceApi(kc);
    this._templateApi = new NodeDevWorkspaceTemplateApi(kc);
    this._cheApi = new NodeCheApi(kc);
    this.apisApi = kc.makeApiClient(k8s.ApisApi);
  }

  get workspaceApi(): IDevWorkspaceApi {
    return this._workspaceApi;
  }

  get templateApi(): IDevWorkspaceTemplateApi {
    return this._templateApi;
  }

  get cheApi(): ICheApi {
    return this._cheApi;
  }

  async isDevWorkspaceApiEnabled(): Promise<boolean> {
    if (this.apiEnabled !== undefined) {
      return Promise.resolve(this.apiEnabled);
    }
    this.apiEnabled = await findApi(this.apisApi, devWorkspaceApiGroup, devworkspaceVersion);
    return this.apiEnabled;
  }
}

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
import { inject, injectable } from 'inversify';
import { devWorkspaceApiGroup, devworkspaceVersion } from '../common';
import {
  ICheApi,
  IDevWorkspaceApi,
  IDevWorkspaceClientApi,
  IDevWorkspaceTemplateApi,
  INVERSIFY_TYPES,
} from '../types';
import { findApi } from './helper';

@injectable()
export class NodeApi implements IDevWorkspaceClientApi {
  private apisApi!: k8s.ApisApi;
  private apiEnabled: boolean | undefined;

  constructor(
    @inject(INVERSIFY_TYPES.IDevWorkspaceNodeTemplateApi) private _templateApi: IDevWorkspaceTemplateApi,
    @inject(INVERSIFY_TYPES.IDevWorkspaceNodeApi) private _workspaceApi: IDevWorkspaceApi,
    @inject(INVERSIFY_TYPES.IDevWorkspaceNodeCheApi) private _cheApi: ICheApi
  ) {}

  set config(kc: k8s.KubeConfig) {
    this.apisApi = kc.makeApiClient(k8s.ApisApi);
  }

  get templateApi(): IDevWorkspaceTemplateApi {
    return this._templateApi;
  }

  get workspaceApi(): IDevWorkspaceApi {
    return this._workspaceApi;
  }

  get cheApi(): ICheApi {
    return this._cheApi;
  }

  async isDevWorkspaceApiEnabled(): Promise<boolean> {
    if (this.apiEnabled !== undefined) {
      return Promise.resolve(this.apiEnabled);
    }
    this.apiEnabled = await findApi(this.apisApi!, devWorkspaceApiGroup, devworkspaceVersion);
    return this.apiEnabled;
  }
}

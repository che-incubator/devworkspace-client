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
import { devWorkspaceApiGroup, devworkspaceVersion } from '../common';
import {
  ICheApi,
  IDevWorkspaceApi,
  IDevWorkspaceClientApi,
  IDevWorkspaceTemplateApi,
} from '../types';
import { findApi } from './helper';
import { RestDevWorkspaceApi } from './workspace-api';
import { RestDevWorkspaceTemplateApi } from './template-api';
import { RestCheApi } from './che-api';

export class RestApi implements IDevWorkspaceClientApi {
  private axios: AxiosInstance;
  private _workspaceApi: IDevWorkspaceApi;
  private _templateApi: IDevWorkspaceTemplateApi;
  private _cheApi: ICheApi;
  private apiEnabled: boolean | undefined;

  constructor(axios: AxiosInstance) {
    this.axios = axios;
    this._workspaceApi = new RestDevWorkspaceApi(axios);
    this._templateApi = new RestDevWorkspaceTemplateApi(axios);
    this._cheApi = new RestCheApi(axios);
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
    this.apiEnabled = await findApi(this.axios, devWorkspaceApiGroup, devworkspaceVersion);
    return this.apiEnabled;
  }
}

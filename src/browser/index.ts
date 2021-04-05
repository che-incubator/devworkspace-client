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
import { RestDevWorkspaceTemplateApi } from './template-api';
import { RestCheApi } from './che-api';
import { RestDevWorkspaceApi } from './workspace-api';

export class RestApi implements IDevWorkspaceClientApi {
  private _axios: AxiosInstance;
  private _devworkspaceApi: IDevWorkspaceApi;
  private _templateApi: IDevWorkspaceTemplateApi;
  private _cheApi: ICheApi;
  private apiEnabled: boolean | undefined;

  constructor(axios: AxiosInstance) {
    this._axios = axios;
    this._devworkspaceApi = new RestDevWorkspaceApi(axios);
    this._templateApi = new RestDevWorkspaceTemplateApi(axios);
    this._cheApi = new RestCheApi(axios);
  }

  set config(axios: AxiosInstance) {
    this._axios = axios;
  }

  get devworkspaceApi(): IDevWorkspaceApi {
    return this._devworkspaceApi;
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
    this.apiEnabled = await findApi(this._axios, devWorkspaceApiGroup, devworkspaceVersion);
    return this.apiEnabled;
  }
}

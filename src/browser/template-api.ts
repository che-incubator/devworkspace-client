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
import { IDevWorkspaceTemplate, IDevWorkspaceTemplateApi } from '../types';
import { devworkspaceVersion, devWorkspaceApiGroup, devworkspaceTemplateSubresource } from '../common';
import { BrowserRequestError } from './helper';

export class RestDevWorkspaceTemplateApi implements IDevWorkspaceTemplateApi {
  private _axios: AxiosInstance;

  constructor(axios: AxiosInstance) {
    this._axios = axios;
  }

  set config(axios: AxiosInstance) {
    this._axios = axios;
  };

  async listInNamespace(namespace: string): Promise<IDevWorkspaceTemplate[]> {
    try {
      const resp = await this._axios.get(
        `/apis/${devWorkspaceApiGroup}/${devworkspaceVersion}/namespaces/${namespace}/${devworkspaceTemplateSubresource}`
      );
      return resp.data.items;
    } catch (e) {
      return Promise.reject(new BrowserRequestError(e));
    }
  }

  async getByName(
    namespace: string,
    name: string
  ): Promise<IDevWorkspaceTemplate> {
    try {
      const resp = await this._axios.get(
        `/apis/${devWorkspaceApiGroup}/${devworkspaceVersion}/namespaces/${namespace}/${devworkspaceTemplateSubresource}/${name}`
      );
      return resp.data;
    } catch (e) {
      return Promise.reject(new BrowserRequestError(e));
    }
  }

  async create(
    devworkspaceTemplate: IDevWorkspaceTemplate,
  ): Promise<IDevWorkspaceTemplate> {
    try {
      const resp = await this._axios.post(
        `/apis/${devWorkspaceApiGroup}/${devworkspaceVersion}/namespaces/${devworkspaceTemplate.metadata.namespace}/${devworkspaceTemplateSubresource}`,
        devworkspaceTemplate,
        {
          headers: {
            'content-type': 'application/json; charset=utf-8',
          },
        }
      );
      return resp.data;
    } catch (e) {
      return Promise.reject(new BrowserRequestError(e));
    }
  }

  async delete(namespace: string, name: string): Promise<void> {
    this._axios.delete(
      `/apis/${devWorkspaceApiGroup}/${devworkspaceVersion}/namespaces/${namespace}/${devworkspaceTemplateSubresource}/${name}`
    );
  }
}

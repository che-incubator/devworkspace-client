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
import { devfileToDevWorkspace } from '../common/converter';
import { IDevWorkspace, IDevWorkspaceDevfile } from '../types';
import { deletePolicy, deletionOptions } from '../common/models';
import { IDevWorkspaceApi } from '../index';
import { devworkspaceVersion, devWorkspaceApiGroup, devworkspacePluralSubresource } from '../common';
import { RequestError } from './helper';
import { delay } from '../common/helper';

export class RestDevWorkspaceApi implements IDevWorkspaceApi {
  private _axios: AxiosInstance;

  constructor(axios: AxiosInstance) {
    this._axios = axios;
  }

  set config(axios: AxiosInstance) {
    this._axios = axios;
  };

  async listInNamespace(namespace: string): Promise<IDevWorkspace[]> {
    try {
      const resp = await this._axios.get(
        `/apis/${devWorkspaceApiGroup}/${devworkspaceVersion}/namespaces/${namespace}/${devworkspacePluralSubresource}`
      );
      return resp.data.items;
    } catch (e) {
      return Promise.reject(new RequestError(e));
    }
  }

  async getByName(
    namespace: string,
    workspaceName: string
  ): Promise<IDevWorkspace> {
    try {
      const resp = await this._axios.get(
        `/apis/${devWorkspaceApiGroup}/${devworkspaceVersion}/namespaces/${namespace}/${devworkspacePluralSubresource}/${workspaceName}`
      );
      return resp.data;
    } catch (e) {
      return Promise.reject(new RequestError(e));
    }
  }

  async create(
    devfile: IDevWorkspaceDevfile,
    routingClass: string,
    started = true
  ): Promise<IDevWorkspace> {
    try {
      const devworkspace = devfileToDevWorkspace(devfile, routingClass, started);
      const stringifiedDevWorkspace = JSON.stringify(devworkspace);
  
      const resp = await this._axios.post(
        `/apis/${devWorkspaceApiGroup}/${devworkspaceVersion}/namespaces/${devfile.metadata.namespace}/${devworkspacePluralSubresource}`,
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
    } catch (e) {
      return Promise.reject(new RequestError(e));
    }
  }

  async update(devworkspace: IDevWorkspace): Promise<IDevWorkspace> {
    try {
      const name = devworkspace.metadata.name;
      const namespace = devworkspace.metadata.namespace;
      const resp = await this._axios.put(
        `/apis/${devWorkspaceApiGroup}/${devworkspaceVersion}/namespaces/${namespace}/${devworkspacePluralSubresource}/${name}`,
        devworkspace,
        {
          headers: {
            'content-type': 'application/json; charset=utf-8',
          },
        }
      );
      return resp.data;
    } catch (e) {
      return Promise.reject(new RequestError(e));
    }
  }

  async delete(namespace: string, name: string): Promise<void> {
    await this._axios.delete(
      `/apis/${devWorkspaceApiGroup}/${devworkspaceVersion}/namespaces/${namespace}/${devworkspacePluralSubresource}/${name}`, {
        headers: {
          'content-type': 'application/json; charset=utf-8',
        },
        data: deletionOptions(deletePolicy.Background)
      }
    );
  }

  async changeStatus(namespace: string, name: string, started: boolean): Promise<IDevWorkspace> {
    try {
      const patch = [
        {
          path: '/spec/started',
          op: 'replace',
          value: started,
        },
      ];
  
      const resp = await this._axios.patch(
        `/apis/${devWorkspaceApiGroup}/${devworkspaceVersion}/namespaces/${namespace}/${devworkspacePluralSubresource}/${name}`,
        patch,
        {
          headers: {
            'Content-type': 'application/json-patch+json',
          },
        }
      );
      return resp.data;
    } catch (e) {
      return Promise.reject(new RequestError(e));
    }
  }
}

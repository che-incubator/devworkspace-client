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
import { IDevWorkspace, IDevWorkspaceDevfile, Patch } from '../types';
import { deletePolicy, deletionOptions } from '../common/models';
import { IDevWorkspaceApi } from '../index';
import { delay } from '../common/helper';
import { devworkspaceVersion, devWorkspaceApiGroup, devworkspacePluralSubresource } from '../common';
import { BrowserRequestError } from './helper';

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
      return Promise.reject(new BrowserRequestError(e));
    }
  }

  async getByName(
    namespace: string,
    name: string
  ): Promise<IDevWorkspace> {
    try {
      const resp = await this._axios.get(
        `/apis/${devWorkspaceApiGroup}/${devworkspaceVersion}/namespaces/${namespace}/${devworkspacePluralSubresource}/${name}`
      );
      return resp.data;
    } catch (e) {
      return Promise.reject(new BrowserRequestError(e));
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
          `Was not able to find a devworkspace with name ${name} in namespace ${namespace}`
        );
      }
      return found;
    } catch (e) {
      return Promise.reject(new BrowserRequestError(e));
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
      return Promise.reject(new BrowserRequestError(e));
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

  /**
   * Patch a devworkspace
   * @param devworkspace The devworkspace you want to patch
   */
  async patch(namespace: string, name: string, patches: Patch[]): Promise<IDevWorkspace> {
    return this.createPatch(namespace, name, patches);
  }

  async changeStatus(namespace: string, name: string, started: boolean): Promise<IDevWorkspace> {
    return this.createPatch(namespace, name, [{
      op: 'replace',
      path: '/spec/started',
      value: started
    }]);
  }

  private async createPatch(
    namespace: string,
    name: string,
    patches: Patch[]) {
      try {    
        const resp = await this._axios.patch(
          `/apis/${devWorkspaceApiGroup}/${devworkspaceVersion}/namespaces/${namespace}/${devworkspacePluralSubresource}/${name}`,
          patches,
          {
            headers: {
              'Content-type': 'application/json-patch+json',
            },
          }
        );
        return resp.data;
      } catch (e) {
        return Promise.reject(new BrowserRequestError(e));
      }
  }
}

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
import { delay } from '../common/helper';
import { IDevWorkspaceApi } from '../index';
import { devworkspaceVersion, devWorkspaceApiGroup, devworkspacePluralSubresource } from '../common';
import { deletePolicy, deletionOptions } from '../common/models';

export class RestDevWorkspaceApi implements IDevWorkspaceApi {
  private axios: AxiosInstance;

  constructor(axios: AxiosInstance) {
    this.axios = axios;
  }

  async listInNamespace(namespace: string): Promise<IDevWorkspace[]> {
    const resp = await this.axios.get(
      `/apis/${devWorkspaceApiGroup}/${devworkspaceVersion}/namespaces/${namespace}/${devworkspacePluralSubresource}`
    );
    return resp.data.items;
  }

  async getByName(
    namespace: string,
    workspaceName: string
  ): Promise<IDevWorkspace> {
    const resp = await this.axios.get(
      `/apis/${devWorkspaceApiGroup}/${devworkspaceVersion}/namespaces/${namespace}/${devworkspacePluralSubresource}/${workspaceName}`
    );
    return resp.data;
  }

  async create(
    devfile: IDevWorkspaceDevfile,
    started = true
  ): Promise<IDevWorkspace> {
    const devworkspace = devfileToDevWorkspace(devfile, started);
    const stringifiedDevWorkspace = JSON.stringify(devworkspace);

    const resp = await this.axios.post(
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
  }

  async update(devworkspace: IDevWorkspace): Promise<IDevWorkspace> {
    const name = devworkspace.metadata.name;
    const namespace = devworkspace.metadata.namespace;
    const resp = await this.axios.put(
      `/apis/${devWorkspaceApiGroup}/${devworkspaceVersion}/namespaces/${namespace}/${devworkspacePluralSubresource}/${name}`,
      devworkspace,
      {
        headers: {
          'content-type': 'application/json; charset=utf-8',
        },
      }
    );
    return resp.data;
  }

  async delete(namespace: string, name: string): Promise<void> {
    await this.axios.delete(
      `/apis/${devWorkspaceApiGroup}/${devworkspaceVersion}/namespaces/${namespace}/${devworkspacePluralSubresource}/${name}`, {
        headers: {
          'content-type': 'application/json; charset=utf-8',
        },
        data: deletionOptions(deletePolicy.Background)
      }
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
      `/apis/${devWorkspaceApiGroup}/${devworkspaceVersion}/namespaces/${namespace}/${devworkspacePluralSubresource}/${name}`,
      patch,
      {
        headers: {
          'Content-type': 'application/json-patch+json',
        },
      }
    );
    return resp.data;
  }
}

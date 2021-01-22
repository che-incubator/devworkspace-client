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
import { devfileToDevWorkspace } from './converter';
import { delay } from './helper';
import * as yaml from 'js-yaml';

export interface IDevWorkspaceApi {
  getAllWorkspaces(defaultNamespace: string): Promise<any>;
  getWorkspaceByName(namespace: string, workspaceName: string): Promise<any>;
  create(devfile: any): Promise<any>;
  delete(namespace: string, name: string): Promise<any>;
  changeWorkspaceStatus(workspace: any, started: boolean): Promise<any>;
}

export class DevWorkspaceApi implements IDevWorkspaceApi {
  private axios: AxiosInstance;

  constructor(axios: AxiosInstance) {
    this.axios = axios;
  }

  getAllWorkspaces(defaultNamespace: string): Promise<any> {
    return this.axios
      .get(
        `/api/unsupported/k8s/apis/workspace.devfile.io/v1alpha2/namespaces/${defaultNamespace}/devworkspaces`
      )
      .then((resp: any) => resp.data.items)
      .catch((e) => {
        throw new Error(e);
      });
  }

  getWorkspaceByName(namespace: string, workspaceName: string): Promise<any> {
    return this.axios
      .get(
        `/api/unsupported/k8s/apis/workspace.devfile.io/v1alpha2/namespaces/${namespace}/devworkspaces/${workspaceName}`
      )
      .then((resp: any) => resp.data)
      .catch((e) => {
        throw new Error(e);
      });
  }

  create(devfile: any): Promise<any> {
    const devworkspace = devfileToDevWorkspace(devfile);
    return this.axios
      .post(
        `/api/unsupported/k8s/apis/workspace.devfile.io/v1alpha2/namespaces/${devfile.metadata.namespace}/devworkspaces`,
        devworkspace,
        {
            headers: {
                'content-type': 'application/json; charset=utf-8'
            }
        }
      )
      .then(async (resp: any) => {
        // We need to wait until the devworkspace has a status property
        let found;
        let count = 0;
        while (count < 5 && !found) {
          const potentialWorkspace = await this.getWorkspaceByName(
            devfile.metadata.namespace,
            devfile.metadata.name
          );
          if (potentialWorkspace?.status) {
            found = potentialWorkspace;
          } else {
            count += 1;
            delay();
          }
        }
        if (!found) {
          throw new Error('Was not able to get workspace status');
        }
        return found;
      })
      .catch((resp: any) => {
        throw new Error(resp.response.data.message);
      });
  }

  delete(namespace: string, name: string): Promise<any> {
    return this.axios
      .delete(
        `/api/unsupported/k8s/apis/workspace.devfile.io/v1alpha2/namespaces/${namespace}/devworkspaces/${name}`
      )
      .catch((e) => {
        throw new Error(e);
      });
  }

  changeWorkspaceStatus(workspace: any, started: boolean): Promise<any> {
    const patch = [
      {
        path: '/spec/started',
        op: 'replace',
        value: started,
      },
    ];

    return this.axios
      .patch(
        `/api/unsupported/k8s/apis/workspace.devfile.io/v1alpha2/namespaces/${workspace.metadata.namespace}/devworkspaces/${workspace.metadata.name}`,
        patch,
        {
            headers: {
                'Content-type': 'application/json-patch+json'
            }
        }
      )
      .then((resp: any) => resp.data)
      .catch((e) => {
        throw new Error(e);
      });
  }
}

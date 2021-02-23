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
  IDevWorkspaceApi,
  IDevWorkspaceClientApi,
  INodeConfig,
} from '../types';
import { isInCluster } from './helper';
import { NodeDevWorkspaceApi } from './workspace-api';

export class NodeApi implements IDevWorkspaceClientApi {
  private _workspaceApi: IDevWorkspaceApi;

  constructor(config: INodeConfig) {
    const kc = new k8s.KubeConfig();
    if (config.inCluster) {
      if (!isInCluster()) {
        throw new Error(
          'Recieved error message when attempting to load authentication from cluster. Most likely you are not running inside of a container. Set environment variable DEVELOPMENT=true. See README.md for more details.'
        );
      }
      kc.loadFromCluster();
    } else {
      kc.loadFromDefault();
    }
    this._workspaceApi = new NodeDevWorkspaceApi(kc);
  }

  get workspaceApi(): IDevWorkspaceApi {
    return this._workspaceApi;
  }
}

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

import {
  IDevWorkspaceApi,
  IDevWorkspaceClientApi,
} from '../types';
import { NodeDevWorkspaceApi } from './workspace-api';

export class NodeApi implements IDevWorkspaceClientApi {
  private _workspaceApi: IDevWorkspaceApi;

  constructor() {
    this._workspaceApi = new NodeDevWorkspaceApi();
  }

  get workspaceApi(): IDevWorkspaceApi {
    return this._workspaceApi;
  }
}

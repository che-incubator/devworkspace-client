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

import { IDevWorkspaceClient, IDevWorkspaceClientApi, INodeConfig, INVERSIFY_TYPES } from '../types';
import { inject, injectable } from 'inversify';

@injectable()
export class DevWorkspaceClient implements IDevWorkspaceClient {

    constructor(
        @inject(INVERSIFY_TYPES.INodeApiFactory) private nodeFactory: (config: INodeConfig) => IDevWorkspaceClientApi) {
    }

    public getNodeApi(config: INodeConfig = {
        inCluster: true
    }): IDevWorkspaceClientApi {
        if (!this.isItNode()) {
            throw new Error('getNodeApi is only available when running in nodejs');
        } else {
            return this.nodeFactory!(config);
        }
    }

    private isItNode(): boolean {
        return (typeof process !== 'undefined') && (typeof process.versions.node !== 'undefined');
    }

}

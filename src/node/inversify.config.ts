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

import 'reflect-metadata';
import { Container, interfaces } from 'inversify';
import { NodeDevWorkspaceTemplateApi } from './template-api';
import { ICheApi, IDevWorkspaceApi, IDevWorkspaceClientApi, IDevWorkspaceTemplateApi, INodeConfig, INVERSIFY_TYPES } from '../types';
import { NodeDevWorkspaceApi } from './workspace-api';
import { NodeApi } from './index';
import * as k8s from '@kubernetes/client-node';
import { isInCluster } from './helper';
import { DevWorkspaceClient } from './client';
import { NodeCheApi } from './che-api';

const container = new Container();
container.bind(INVERSIFY_TYPES.IDevWorkspaceClient).to(DevWorkspaceClient).inSingletonScope();
container.bind(INVERSIFY_TYPES.IDevWorkspaceNodeClientApi).to(NodeApi).inSingletonScope();
container.bind(INVERSIFY_TYPES.IDevWorkspaceNodeApi).to(NodeDevWorkspaceApi).inSingletonScope();
container.bind(INVERSIFY_TYPES.IDevWorkspaceNodeTemplateApi).to(NodeDevWorkspaceTemplateApi).inSingletonScope();
container.bind(INVERSIFY_TYPES.IDevWorkspaceNodeCheApi).to(NodeCheApi).inSingletonScope();

container.bind<interfaces.Factory<IDevWorkspaceClientApi>>(INVERSIFY_TYPES.INodeApiFactory).toFactory<IDevWorkspaceClientApi>((context: interfaces.Context) => {
    return (nodeConfig: INodeConfig) => {
        const kc = new k8s.KubeConfig();
        if (nodeConfig.inCluster) {
            if (!isInCluster()) {
                throw new Error(
                    'Recieved error message when attempting to load authentication from cluster. Most likely you are not running inside of a container.'
                );
            }
            kc.loadFromCluster();
        } else {
            kc.loadFromDefault();
        }

        const devworkspaceClientAPI = context.container.get<IDevWorkspaceClientApi>(INVERSIFY_TYPES.IDevWorkspaceNodeClientApi);
        devworkspaceClientAPI.config = kc;

        const devWorkspaceApi = context.container.get<IDevWorkspaceApi>(INVERSIFY_TYPES.IDevWorkspaceNodeApi);
        devWorkspaceApi.config = kc;

        const devWorkspaceTemplate = context.container.get<IDevWorkspaceTemplateApi>(INVERSIFY_TYPES.IDevWorkspaceNodeTemplateApi);
        devWorkspaceTemplate.config = kc;

        const cheApi = context.container.get<ICheApi>(INVERSIFY_TYPES.IDevWorkspaceNodeCheApi);
        cheApi.config = kc;

        return devworkspaceClientAPI;
    };
});
export { container }

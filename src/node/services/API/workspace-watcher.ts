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
import { IDevWorkspace, IDevWorkspaceWatcher, IDevWorkspaceCallbacks } from '../../../types';
import { injectable } from 'inversify';
import { devWorkspaceApiGroup, devworkspaceVersion } from '../../../common/const';

@injectable()
export class NodeDevWorkspaceWatcher implements IDevWorkspaceWatcher {
    private customObjectWatch!: k8s.Watch;

    set config(kc: k8s.KubeConfig) {
        this.customObjectWatch = new k8s.Watch(kc);
    }

    async watcher(namespace: string, callbacks: IDevWorkspaceCallbacks): Promise<{ abort: Function }> {
        const path = `/apis/${devWorkspaceApiGroup}/${devworkspaceVersion}/watch/namespaces/${namespace}/devworkspaces`;

        return this.customObjectWatch.watch(path, {}, (type: string, devworkspace: IDevWorkspace) => {
            const status = devworkspace!.status!.phase;
            const workspaceId = devworkspace!.status!.devworkspaceId;

            if (type === 'ADDED') {
                callbacks.onAdded(devworkspace);
            } else if (type === 'MODIFIED') {
                callbacks.onModified(devworkspace);
            } else if (type === 'DELETED') {
                callbacks.onDeleted(workspaceId);
            } else {
                callbacks.onError(`Error: Unknown type '${type}'.`);
            }
        }, (error: any) => {
            callbacks.onError(`Error: ${error}`);
        });
    }

}

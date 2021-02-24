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
import { IKubernetesGroupsModel } from '../types';
import { projectApiGroup } from '../common';

export async function isOpenShiftCluster(axios: AxiosInstance): Promise<boolean> {
    return findApi(axios, projectApiGroup);
}

export async function findApi(axios: AxiosInstance, apiName: string, version?: string): Promise<boolean> {
    const resp = await axios.get('/apis');
    const responseData = await resp.data.groups;
    return responseData.filter((apiGroup: IKubernetesGroupsModel) => {
        if (version) {
            return apiGroup.name === apiName && apiGroup.versions.filter(versionGroup => versionGroup.version === version).length > 0;
        }
        return apiGroup.name === apiName;
    }).length > 0;
}

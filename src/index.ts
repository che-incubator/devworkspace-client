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
import { RestApi } from './browser';
import { NodeApi } from './node';

export * from './common/converter';
export * from './types';

export class DevWorkspaceClient {

    public static getRestApi(axios: AxiosInstance) {
        return new RestApi(axios);
    }

    public static getNodeApi() {
        if (!this.isItNode()) {
            throw new Error('getNodeApi is only available when running in nodejs');
        }
        return new NodeApi();
    }

    private static isItNode() {
        return (typeof process !== 'undefined') && (typeof process.versions.node !== 'undefined');
    }

}

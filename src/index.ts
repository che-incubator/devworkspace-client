/*********************************************************************
 * Copyright (c) 2018 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 **********************************************************************/

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { DevWorkspaceApi } from './rest';

export type Interceptor = (value: AxiosRequestConfig) => AxiosRequestConfig | Promise<AxiosRequestConfig>;
export interface IAxiosConfig {
    baseURL?: string;
    interceptors?: Interceptor[];
    token?: string;
}

export class DevWorkspaceClient {

    private static axios: AxiosInstance;
    private static unsupportedUrl: string = '/unsupported/k8s';

    public static configureAxios(config: IAxiosConfig) {
        if (config.baseURL) {
            DevWorkspaceClient.axios = axios.create({
                baseURL: config.baseURL + '/api' + DevWorkspaceClient.unsupportedUrl
            });
        }
        if (config.interceptors) {
            config.interceptors.forEach((interceptor) => {
                DevWorkspaceClient.axios.interceptors.request.use(interceptor);
            });
        }
        if (config.token) {
            DevWorkspaceClient.axios.defaults.headers.common.Authorization = `Bearer ${config.token}`;
        }
    }

    public static getRestApi() {
        return new DevWorkspaceApi(this.axios);
    }

}

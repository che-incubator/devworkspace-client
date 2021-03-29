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

import { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
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


export interface IRequestConfig extends AxiosRequestConfig {
}

export interface IResponse<T> extends AxiosResponse<T> {
    data: T;
    status: number;
    statusText: string;
    headers: any;
    config: IRequestConfig;
    request?: any;
}

export interface IRequestError extends Error {
    status?: number;
    config: AxiosRequestConfig;
    request?: any;
    response?: IResponse<any>;
}

export class RequestError implements IRequestError {

    status: number | undefined;
    name: string;
    message: string;
    config: AxiosRequestConfig;
    request: any;
    response: AxiosResponse | undefined;

    constructor(error: AxiosError) {
        if (error.code) {
            this.status = Number(error.code);
        }
        this.name = error.name;
        this.config = error.config;
        if (error.request) {
            this.request = error.request;
        }
        if (error.response) {
            this.response = error.response;
        }
        if ((this.status === -1 || !this.status) && (!this.response  || (this.response && !this.response.status))) {
            // request is interrupted, there is not even an error
            this.message = `network issues occured while requesting "${this.config.url}".`;
        } else if (this.response && this.response.data && this.response.data.message) {
            // che Server error that should be self-descriptive
            this.message = this.response.data.message;
        } else {
            // the error is not from Che Server, so error may be in html format that we're not able to handle.
            // displaying just a error code and URL.

            // sometimes status won't be defined, so when it's not look into the response status more info
            let status = this.status;
            if (!this.status && this.response && this.response.status) {
                status = this.response.status;
            // defer to the status code of the request if there is no response
            } else if (!this.status && this.request && this.request.status) {
                status = this.request.status;
            }
            this.message = `"${status}" returned by "${this.config.url}"."`;
        }
    }
}

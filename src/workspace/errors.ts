/**********************************************************************
 * Copyright (c) 2021 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 ***********************************************************************/

import { IncomingMessage } from 'http';
import * as createError from 'http-errors';

export interface IKubernetesIncomingMessage extends IncomingMessage {
    body: {
        message: string
        details: {
            name: string;
        }
    };
}

// handle incoming creation errors
export function handleCreationErrors(response: IKubernetesIncomingMessage, namespace: string) {
    if (response.statusCode === 409) {
        const errorMessage = `Workspace with name "${response.body.details.name}" in namespace "${namespace}" already exists`;
        throw createError(409, errorMessage);
    }
    return response;
}

// handle 400 series errors generically
export function handleGenericError(response: IKubernetesIncomingMessage) {
    if (response.statusCode && response.statusCode >= 400 && response.statusCode < 500) {
        throw createError(response.statusCode, response.body.message);
    }
    return response;
}

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

export interface IKubernetesIncomingMessage extends IncomingMessage {
  body: {
    message: string
    details: {
      name: string;
    }
  };
}

// handle incoming creation errors
export function handleCreationErrors(response: IKubernetesIncomingMessage, namespace: string): Error {
  if (response.statusCode === 409) {
    const errorMessage = `Workspace with name "${response.body.details.name}" in namespace "${namespace}" already exists`;
    throw new Error(errorMessage);
  }
  return handleGenericError(response);
}

export function handleGenericError(response: IKubernetesIncomingMessage): Error {
  if (response.body && response.body.message) {
    throw new Error(response.body.message);
  }
  throw new Error(response.statusMessage);
}

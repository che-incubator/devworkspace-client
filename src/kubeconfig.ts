/*********************************************************************
 * Copyright (c) 2018 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 **********************************************************************/
import { Cluster, User } from '@kubernetes/client-node/dist/config_types';

export function createCluster(): Cluster {
    const host = process.env['KUBERNETES_SERVICE_HOST'];
    const port = process.env['KUBERNETES_SERVICE_PORT'];
    if (!host || !port) {
        console.log('Unknown host or port');
    }
    return {
        name: 'developer-cluster',
        server: `https://${host}:${port}`,
    } as Cluster;
}

export function createUser(token: string): User {
    return {
        name: 'developer',
        token: token
    } as User;
}

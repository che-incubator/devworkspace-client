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

export * from './common/converter';
export * from './common/index';
export * from './types';
export * from './browser/index';

// We have to load these with require so that in the browser side module nothing fails when they aren't included in the webpack bundle
const client = require('./node/client').DevWorkspaceClient;
const container = require('./node/inversify.config').container;
export {
    client as DevWorkspaceClient,
    container
}

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

export const developmentId = 'DEVELOPMENT';
export const isDevelopmentEnabled = () => developmentId in process.env && process.env[developmentId] === 'true';

export const isInContainer = () => 'KUBERNETES_SERVICE_HOST' in process.env && 'KUBERNETES_SERVICE_PORT' in process.env;


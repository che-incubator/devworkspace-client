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

export function devfileToDevWorkspace(devfile: any) {
    return {
        apiVersion: 'workspace.devfile.io/v1alpha2',
        kind: 'DevWorkspace',
        metadata: devfile.metadata,
        spec: {
            template: {
                projects: devfile.projects || [],
                components: devfile.components || [],
                commands: devfile.commands || [],
                events: devfile.events || []
            }
        }
    };
}

export function devWorkspaceToDevfile(devworkspace: any) {
    return {
        schemaVersion: '2.0.0',
        metadata: {
            name: devworkspace.metadata.name,
            namespace: devworkspace.metadata.namespace
        },
        projects: devworkspace.spec.template.projects || [],
        components: devworkspace.spec.template.components || [],
        commands: devworkspace.spec.template.commands || [],
        events: devworkspace.spec.template.events || []
    };
}

export function convertV1EditorsToV2() {

}


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

import { V1alpha2DevWorkspace, V1alpha2DevWorkspaceSpecTemplate, V220Devfile } from '@devfile/api';
import { devworkspaceKind, devworkspaceVersion, devWorkspaceApiGroup } from '.';

//TODO Make clients of this method set namespace
export function devfileToDevWorkspace(devfile: V220Devfile, routingClass: string, started: boolean): V1alpha2DevWorkspace {
    const template: V1alpha2DevWorkspaceSpecTemplate = {}
    if (devfile.projects) {
        template.projects = devfile.projects;
    }
    if (devfile.components) {
        template.components = devfile.components;
    }
    if (devfile.commands) {
        template.commands = devfile.commands;
    }
    if (devfile.events) {
        template.events = devfile.events;
    }

    const devfileAttributes = devfile.metadata?.attributes || {} as any;
    const devWorkspaceAnnotations = devfileAttributes['dw.metadata.annotations'] || {}
    return {
        apiVersion: `${devWorkspaceApiGroup}/${devworkspaceVersion}`,
        kind: devworkspaceKind,
        metadata: {
            name: devfile.metadata?.name,
            annotations: devWorkspaceAnnotations,
        },
        spec: {
            started,
            routingClass,
            template: template,
        }
    }
  }

export function devWorkspaceToDevfile(devworkspace: V1alpha2DevWorkspace): V220Devfile {
    const template: V220Devfile = {
        schemaVersion: '2.1.0',
        metadata: {
            name: devworkspace?.metadata?.name  || '',
        },
    };
    if (devworkspace.spec?.template?.projects) {
        template.projects = devworkspace.spec.template.projects;
    }
    if (devworkspace.spec?.template?.components) {
        template.components = filterPluginComponents(devworkspace.spec.template.components);
    }
    if (devworkspace.spec?.template?.commands) {
        template.commands = devworkspace.spec.template.commands;
    }
    if (devworkspace.spec?.template?.events) {
        template.events = devworkspace.spec.template.events;
    }
    return template;
}

// Filter plugins from components
function filterPluginComponents(components: any[]): any[] {
    return components.filter(comp => !("plugin" in comp));
}

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

import * as yaml from 'js-yaml';

interface IDevWorkspaceConversionTemplate {
    projects?: any;
    components?: any;
    commands?: any;
    events?: any;
}

interface IDevWorkspaceDevfileConversionTemplate {
    schemaVersion: any;
    metadata: {
        name: string;
        namespace: string;
    };
    projects?: any;
    components?: any;
    commands?: any;
    events?: any;
}

export function devfileToDevWorkspace(devfile: any) {
    const template = {
        apiVersion: 'workspace.devfile.io/v1alpha2',
        kind: 'DevWorkspace',
        metadata: devfile.metadata,
        spec: {
            started: true,
            template: {} as IDevWorkspaceConversionTemplate
        }
    };
    if (devfile.projects) {
        template.spec.template.projects = devfile.projects;
    }
    if (devfile.components) {
        template.spec.template.components = devfile.components;
    }
    if (devfile.commands) {
        template.spec.template.commands = devfile.commands;
    }
    if (devfile.events) {
        template.spec.template.events = devfile.events;
    }
    return jsonToYAMLDevfile(template);
}

export function devWorkspaceToDevfile(devworkspace: any) {
    const template = {
        schemaVersion: '2.0.0',
        metadata: {
            name: devworkspace.metadata.name,
            namespace: devworkspace.metadata.namespace
        },
    } as IDevWorkspaceDevfileConversionTemplate;
    if (devworkspace.spec.template.projects) {
        template.projects = devworkspace.spec.template.projects;
    }
    if (devworkspace.spec.template.components) {
        template.components = devworkspace.spec.template.components;
    }
    if (devworkspace.spec.template.commands) {
        template.commands = devworkspace.spec.template.commands;
    }
    if (devworkspace.spec.template.events) {
        template.events = devworkspace.spec.template.events;
    }
    return jsonToYAMLDevfile(template);
}

function jsonToYAMLDevfile(template: any) {
    try {
        const devfileYAML = yaml.load(JSON.stringify(template));
        return devfileYAML;
    } catch (e) {
        throw new Error('Errored when attempting to convert json devfile into yaml: ' + e);
    }
}

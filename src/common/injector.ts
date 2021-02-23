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

/**
 * Check the devfile to see an editor already exists
 * @param devfile a v2 devfile
 */
export function hasEditor(devfile: any): boolean {
  // no-op for now
  return false;
}

/**
 * Check to see if a plugin already exists in the devworkspace. A plugin is considered to already exist
 * if the pluginName matches a component name
 * @param devfile a v2 devfile
 * @param pluginName the name of the plugin you want to check
 */
export function hasPlugin(devfile: any, pluginName: any): boolean {
  for (const component of devfile.components) {
    if (component.name === pluginName) {
      return true;
    }
  }
  return false;
}

/**
 * Get a list of plugins that need to be injected into the devfile
 * @param devfile a v2 devfile
 * @param plugins the plugins you want to inject
 */
export function pluginsToInject(devfile: any, plugins: any[]) {
  const pluginsNeeded = [];
  for (const plugin of plugins) {
    if (!hasPlugin(devfile, plugin)) {
      pluginsNeeded.push(plugin);
    }
  }
  return pluginsNeeded;
}

/**
 * Create a kubernetes component for an editor/plugin
 * @param componentName The name you want for the kubernetes component
 */
export function createKubernetesComponent(componentName: string) {
  return {
    name: componentName,
    plugin: {
      kubernetes: {
        name: componentName,
        namespace: 'devworkspace-plugins'
      }
    }
  };
}

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

import { NodeDevWorkspaceApi } from '../src/node/workspace-api';
import { isInCluster } from '../src/node/helper';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as k8s from '@kubernetes/client-node';
import { IDevWorkspaceDevfile } from '../src';
import { delay } from '../src/common/helper';
import { conditionalTest, isIntegrationTestEnabled } from './utils/suite';

describe('DevWorkspace API integration testing against cluster', () => {

    describe('Test Node DevWorkspace Api against local cluster', () => {
        conditionalTest('Test run the creation, retrieval, update and deletion of a devworkspace', isIntegrationTestEnabled, async (done: any) => {
            const kc = new k8s.KubeConfig();
            if (isInCluster()) {
                kc.loadFromCluster();
            } else {
                kc.loadFromDefault();
            }
            const devWorkspaceApi = new NodeDevWorkspaceApi(kc);
            const devfile = yaml.load(fs.readFileSync(__dirname + '/fixtures/sample-devfile.yaml', 'utf-8')) as IDevWorkspaceDevfile;
            const name = devfile.metadata.name;
            const namespace = devfile.metadata.namespace;

            // check that api is enabled
            const isApiEnabled = await devWorkspaceApi.isApiEnabled();
            expect(isApiEnabled).toBe(true);

            // check that the namespace is initialized
            await devWorkspaceApi.initializeNamespace(namespace);
            await delay(5000);
            const projectExists = await devWorkspaceApi.doesProjectExist(namespace);
            expect(projectExists).toBe(true);

            // check that creation works
            const newDevWorkspace = await devWorkspaceApi.create(devfile);
            expect(newDevWorkspace.metadata.name).toBe(name);
            expect(newDevWorkspace.metadata.namespace).toBe(namespace);

            // check that retrieval works
            const allNamespaces = await devWorkspaceApi.getAllWorkspaces(namespace);
            expect(allNamespaces.length).toBe(1);
            const firstDevWorkspace = allNamespaces[0];
            expect(firstDevWorkspace.metadata.name).toBe(name);
            expect(firstDevWorkspace.metadata.namespace).toBe(namespace);

            const singleNamespace = await devWorkspaceApi.getWorkspaceByName(namespace, name);
            expect(singleNamespace.metadata.name).toBe(name);
            expect(singleNamespace.metadata.namespace).toBe(namespace);

            // check that updating works
            const changedWorkspace = await devWorkspaceApi.changeWorkspaceStatus(namespace, name, false);
            expect(changedWorkspace.spec.started).toBe(false);

            await devWorkspaceApi.delete(namespace, name);
            await delay(5000);
            const finalNamespaces = await devWorkspaceApi.getAllWorkspaces(namespace);
            expect(finalNamespaces.length).toBe(0);

            done();
        }, 60000);
    });

});

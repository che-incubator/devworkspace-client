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

import { isInCluster } from '../src/node/helper';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import { IDevWorkspaceDevfile, IDevWorkspaceTemplate, INVERSIFY_TYPES } from '../src';
import { delay } from '../src/common/helper';
import { conditionalTest, isIntegrationTestEnabled } from './utils/suite';
import { container } from '../src/node/inversify.config';
import { DevWorkspaceClient } from '../src/node/client';

describe('DevWorkspace API integration testing against cluster', () => {

    beforeEach(() => {
        container.snapshot();
    });

    afterEach(() => {
        container.restore();
    });

    describe('Test Node DevWorkspace Api against local cluster', () => {
        conditionalTest('Test run the creation, retrieval, update and deletion of a devworkspace', isIntegrationTestEnabled, async (done: any) => {
            const devWorkspaceClient = container.get<DevWorkspaceClient>(INVERSIFY_TYPES.IDevWorkspaceClient);
            const nodeApi = devWorkspaceClient.getNodeApi({
                inCluster: isInCluster()
            });
            const devfile = yaml.load(fs.readFileSync(__dirname + '/fixtures/sample-devfile.yaml', 'utf-8')) as IDevWorkspaceDevfile;
            const name = devfile.metadata.name;
            const namespace = devfile.metadata.namespace;

            // check that api is enabled
            const isApiEnabled = await nodeApi.isDevWorkspaceApiEnabled();
            expect(isApiEnabled).toBe(true);

            // check that the namespace is initialized
            await nodeApi.cheApi.initializeNamespace(namespace);
            await delay(5000);
            const projectExists = await (nodeApi.cheApi as any).doesProjectExist(namespace);
            expect(projectExists).toBe(true);

            // check that creation works
            const newDevWorkspace = await nodeApi.devworkspaceApi.create(devfile, 'che', true);
            expect(newDevWorkspace.metadata.name).toBe(name);
            expect(newDevWorkspace.metadata.namespace).toBe(namespace);

            // check that retrieval works
            const allWorkspaces = await nodeApi.devworkspaceApi.listInNamespace(namespace);
            expect(allWorkspaces.length).toBe(1);
            const firstDevWorkspace = allWorkspaces[0];
            expect(firstDevWorkspace.metadata.name).toBe(name);
            expect(firstDevWorkspace.metadata.namespace).toBe(namespace);

            const singleNamespace = await nodeApi.devworkspaceApi.getByName(namespace, name);
            expect(singleNamespace.metadata.name).toBe(name);
            expect(singleNamespace.metadata.namespace).toBe(namespace);

            // check that updating works
            const changedWorkspace = await nodeApi.devworkspaceApi.changeStatus(namespace, name, false);
            expect(changedWorkspace.spec.started).toBe(false);

            await delay(2000);
            const currentDevWorkspace = await nodeApi.devworkspaceApi.getByName(namespace, name);
            const sampleRouting = 'sample';
            currentDevWorkspace.spec.routingClass = sampleRouting;

            const updatedWorkspace = await nodeApi.devworkspaceApi.update(currentDevWorkspace);
            expect(updatedWorkspace.spec.routingClass).toBe(sampleRouting);

            // check that deletion works
            await nodeApi.devworkspaceApi.delete(namespace, name);
            await delay(5000);
            const finalNamespaces = await nodeApi.devworkspaceApi.listInNamespace(namespace);
            expect(finalNamespaces.length).toBe(0);

            done();
        }, 60000);

        conditionalTest('Test run the creation, retrieval and deletion of a devworkspace template', isIntegrationTestEnabled, async (done: any) => {
            const devWorkspaceClient = container.get<DevWorkspaceClient>(INVERSIFY_TYPES.IDevWorkspaceClient);
            const nodeApi = devWorkspaceClient.getNodeApi({
                inCluster: isInCluster()
            });
            const dwt = yaml.load(fs.readFileSync(__dirname + '/fixtures/sample-dwt.yaml', 'utf-8')) as IDevWorkspaceTemplate;
            const name = dwt.metadata.name;
            const namespace = dwt.metadata.namespace;

            // check that api is enabled
            const isApiEnabled = await nodeApi.isDevWorkspaceApiEnabled();
            expect(isApiEnabled).toBe(true);

            // initialize project if it doesn't exist
            await nodeApi.cheApi.initializeNamespace(namespace);
            await delay(5000);
            const projectExists = await (nodeApi.cheApi as any).doesProjectExist(namespace);
            expect(projectExists).toBe(true);

            // check that creation works
            const newDWT = await nodeApi.templateApi.create(dwt);
            expect(newDWT.metadata.name).toBe(name);
            expect(newDWT.metadata.namespace).toBe(namespace);

            await delay(5000);

            // check that retrieval works
            const allTemplates = await nodeApi.templateApi.listInNamespace(namespace);
            expect(allTemplates.length).toBe(1);
            const firstTemplate = allTemplates[0];
            expect(firstTemplate.metadata.name).toBe(name);
            expect(firstTemplate.metadata.namespace).toBe(namespace);

            const singleNamespace = await nodeApi.templateApi.getByName(namespace, name);
            expect(singleNamespace.metadata.name).toBe(name);
            expect(singleNamespace.metadata.namespace).toBe(namespace);

            // check that deletion works
            await nodeApi.templateApi.delete(namespace, name);
            await delay(5000);
            const finalNamespaces = await nodeApi.templateApi.listInNamespace(namespace);
            expect(finalNamespaces.length).toBe(0);

            done();
        }, 60000);
    });

});

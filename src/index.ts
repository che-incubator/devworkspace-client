/*********************************************************************
 * Copyright (c) 2018 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 **********************************************************************/

import fastify from 'fastify';
import { DevWorkspaceService } from './workspace/service';

const server = fastify();

const workspaceService = new DevWorkspaceService();

server.get('/workspace/getAllDevWorkspaces', async (request, reply) => {
  return workspaceService.getAllWorkspaces();
});

server.get('/workspace/getWorkspacesById', async (request, reply) => {
  return workspaceService.getWorkspaceById((request.params as any).workspaceId);
});

server.get('/', async (request, reploy) => {
  return 'working';
});

server.listen(8080, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});

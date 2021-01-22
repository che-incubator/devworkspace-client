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

server.get('/workspace', async (request, reply) => {
  return workspaceService.getAllWorkspaces();
});

server.post('/workspace', async (request, reply) => {
  return workspaceService.create(request.body);
});

server.get('/workspace/:workspaceId', async (request, reply) => {
  const workspaceId = (request.params as any).workspaceId;
  return workspaceService.getWorkspaceById(workspaceId);
});

server.patch('/workspace/:workspaceId', async (request, reply) => {
  const workspaceId = (request.params as any).workspaceId;
  const started = (request.params as any).started;
  return workspaceService.changeWorkspaceStatus(workspaceId, started);
});

server.listen(8080, '0.0.0.0', (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});

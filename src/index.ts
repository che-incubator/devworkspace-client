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

// tslint:disable-next-line:no-var-requires
server.register(require('fastify-cors'), {
  origin: ['http://localhost:3333'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
});

server.addContentTypeParser('application/merge-patch+json', { parseAs: 'string' }, function (req, body, done) {
  try {
    var json = JSON.parse(body as string);
    done(null, json);
  } catch (err) {
    err.statusCode = 400;
    done(err, undefined);
  }
});

const workspaceService = new DevWorkspaceService();

server.post('/namespace/:namespace', async (request, reply) => {
  const namespace = (request.params as any).namespace;
  return workspaceService.createNamespace(namespace);
});

server.get('/workspace/namespace/:namespace', async (request, reply) => {
  const namespace = (request.params as any).namespace;
  return workspaceService.getAllWorkspaces(namespace);
});

server.post('/workspace', async (request, reply) => {
  return workspaceService.create(request.body);
});

server.get('/workspace/namespace/:namespace/subscribe', async (request, reply) => {
  const namespace = (request.params as any).namespace;
  workspaceService.subscribeToNamespace(namespace, reply);
});

server.delete('/workspace/namespace/:namespace/subscribe', async (request, reply) => {
  const namespace = (request.params as any).namespace;
  workspaceService.unsubscribeFromNamespace(namespace);
});

server.get('/workspace/namespace/:namespace/:workspaceName', async (request, reply) => {
  const namespace = (request.params as any).namespace;
  const workspaceName = (request.params as any).workspaceName;
  return workspaceService.getWorkspaceByName(namespace, workspaceName);
});

server.delete('/workspace/namespace/:namespace/:workspaceName', async (request, reply) => {
  const namespace = (request.params as any).namespace;
  const workspaceName = (request.params as any).workspaceName;
  return workspaceService.delete(namespace, workspaceName);
});

server.patch('/workspace/namespace/:namespace/:workspaceName', async (request, reply) => {
  const namespace = (request.params as any).namespace;
  const workspaceName = (request.params as any).workspaceName;
  const { body } = request;
  return workspaceService.changeWorkspaceStatus(namespace, workspaceName, (body as any).started as boolean);
});

server.listen(8080, '0.0.0.0', (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});

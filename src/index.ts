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

// tslint:disable-next-line:no-var-requires
server.register(require('fastify-websocket'));

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

server.get('/workspace/namespace/:namespace', async (request, reply) => {
  const token = request.headers['authentication'] as string;
  const namespace = (request.params as any).namespace;
  return workspaceService.getAllWorkspaces(namespace, token);
});

server.post('/workspace', async (request, reply) => {
  const token = request.headers['authentication'] as string;
  return workspaceService.create(request.body, token);
});

server.get('/workspace/namespace/:namespace/subscribe', { websocket: true } as any, (connection: any /* SocketStream */, req: any /* FastifyRequest */) => {
  const namespace = (req.params as any).namespace;
  return workspaceService.subscribeToNamespace(connection, namespace);
});

server.delete('/workspace/namespace/:namespace/subscribe', async (request, reply) => {
  const namespace = (request.params as any).namespace;
  workspaceService.unsubscribeFromNamespace(namespace);
});

server.get('/workspace/namespace/:namespace/:workspaceName', async (request, reply) => {
  const token = request.headers['authentication'] as string;
  const namespace = (request.params as any).namespace;
  const workspaceName = (request.params as any).workspaceName;
  return workspaceService.getWorkspaceByName(namespace, workspaceName, token);
});

server.delete('/workspace/namespace/:namespace/:workspaceName', async (request, reply) => {
  const token = request.headers['authentication'] as string;
  const namespace = (request.params as any).namespace;
  const workspaceName = (request.params as any).workspaceName;
  return workspaceService.delete(namespace, workspaceName, token);
});

server.patch('/workspace/namespace/:namespace/:workspaceName', async (request, reply) => {
  const token = request.headers['authentication'] as string;
  const namespace = (request.params as any).namespace;
  const workspaceName = (request.params as any).workspaceName;
  const { body } = request;
  const started = (body as any).started as boolean;
  return workspaceService.changeWorkspaceStatus(namespace, workspaceName, started, token);
});

server.post('/namespace/:namespace', async (request, reply) => {
  const token = request.headers['authentication'] as string;
  const namespace = (request.params as any).namespace;
  return workspaceService.createNamespace(namespace, token);
});

server.listen(8080, '0.0.0.0', (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});

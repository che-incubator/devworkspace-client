# DevWorkspace Client

The DevWorkspace Client is a library for interacting with DevWorkspaces and related objects on your cluster. It's node side library that wraps [@kubernetes/client-node](https://www.npmjs.com/package/@kubernetes/client-node).

It's built and published on each commit from main branch into [@eclipse-che/devworkspace-client](https://www.npmjs.com/package/@eclipse-che/devworkspace-client)

## Examples

```typescript
import 'reflect-metadata';
import { container, INVERSIFY_TYPES } from '@eclipse-che/devworkspace-client';

const devworkspaceClient = container.get(INVERSIFY_TYPES.IDevWorkspaceClient);
const nodeApi = devworkspaceClient.getNodeApi({
    inCluster: false
});
const devworkspaceApi = nodeApi.devworkspaceApi;
const promise = devworkspaceApi.listInNamespace('my_namespace');
promise.then((devworkspaces) => {
    // process devworkspaces received from my_namespace
});
```

## Developer support

### Getting Started

1. Install prerequisite tooling:
    - yarn
    - node
2. Install dependencies
    - Run `yarn install`
3. Build the project
    - Run `yarn run build`
4. To test the project
    - Run `yarn test`

### Integration tests

Integration tests can be run locally by using `export INTEGRATION_TESTS=true`. Refer to the Environment variables section to learn more.

**The devworkspace-controller must be on the cluster before running the integration tests.**

### Environment variables

`INTEGRATION_TESTS`: When the INTEGRATION_TESTS environment variable is defined and it's value is true, the integration tests will run against your currently authenticated cluster.

## License

EPL-2

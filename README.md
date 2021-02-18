# DevWorkspace Client

The DevWorkspace Client is a library for interacting with DevWorkspaces on your cluster. Currently, it uses the kubernetes rest api to make the requests.

## Examples

```typescript
import DevWorkspaceClient from '@eclipse-che/devworkspace-client';
import axios from 'axios';

const restApiClient = DevWorkspaceClient.getRestApi();
const promise = restApiClient.getAllWorkspaces('my_namespace');
promise.then((workspaces) => {
    // process workspaces received from my_namespace
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

## License

EPL-2

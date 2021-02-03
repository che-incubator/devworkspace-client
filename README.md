# DevWorkspace Client

This is a client for DevWorkspace interactions

## Build

To build the devworkspace client use `yarn run build`

## Start

To start the devworkspace client locally use:
NODE_TLS_REJECT_UNAUTHORIZED='0' \
KUBERNETES_SERVICE_HOST=api.crc.testing \
KUBERNETES_SERVICE_PORT=6443 \
KEYCLOAKURL=https://keycloak-eclipse-che.apps-crc.testing \
CHEHOST=localhost:3333 node dist/index.js

## License

EPL-2

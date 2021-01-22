

build:
	yarn run build
	docker build . -t quay.io/jpinkney/devworkspace-client
	docker push quay.io/jpinkney/devworkspace-client

install:
	oc apply -f deploy/deployment.yaml
	oc apply -f deploy/service.yaml
	oc apply -f deploy/route.yaml

uninstall:
	oc delete -f deploy/deployment.yaml --ignore-not-found=true
	oc delete -f deploy/service.yaml --ignore-not-found=true
	oc delete -f deploy/route.yaml --ignore-not-found=true

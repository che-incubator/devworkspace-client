FROM node:14

# Create app directory
WORKDIR /usr/src/app

COPY . .

EXPOSE 8080
CMD [ "node", "dist/index.js" ]

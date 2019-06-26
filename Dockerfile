FROM node:10.16.0

MAINTAINER Maximilian Flis <maximilian.flis@tum.de>

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
ADD . /usr/src/app
RUN npm install
RUN npm i slack-webhook-notifier-1.0.0.tgz
RUN npm run build:docker

CMD ["node", "lib/index.js"]

FROM golang:alpine as builder

ENV DUMB_INIT_VERSION=1.2.2 \
    YGGDRASIL_VERSION=0.3.15

RUN set -ex \
    && apk --no-cache add \
    build-base \
    curl \
    git \
    && git clone "https://github.com/yggdrasil-network/yggdrasil-go.git" /src \
    && cd /src \
    && git reset --hard v${YGGDRASIL_VERSION} \
    && ./build \
    && curl -sSfLo /tmp/dumb-init "https://github.com/Yelp/dumb-init/releases/download/v${DUMB_INIT_VERSION}/dumb-init_${DUMB_INIT_VERSION}_amd64" \
    && chmod 0755 /tmp/dumb-init

FROM node:alpine as frontend_builder
WORKDIR /app

COPY ./frontend/package.json package.json
COPY ./frontend/yarn.lock yarn.lock 

RUN yarn

COPY ./frontend .
RUN ls -al .
RUN mv ./public/config/production.ts ./public/config/config.ts
RUN yarn build

FROM node:alpine as backend_builder
WORKDIR /app

COPY ./backend/package.json package.json
COPY ./backend/yarn.lock yarn.lock 

RUN yarn install

COPY ./backend . 
RUN yarn build


FROM nginx:latest
RUN apt-get -y update && apt-get -y upgrade
RUN apt-get install -y curl musl-tools nano iputils-ping procps iproute2 imagemagick

COPY --from=builder /src/yggdrasil    /usr/bin/
COPY --from=builder /src/yggdrasilctl /usr/bin/
COPY --from=builder /tmp/dumb-init    /usr/bin/
RUN mkdir /var/log/yggdrasil

COPY --from=frontend_builder /app/dist /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=backend_builder /app/ /backend


RUN curl -sL https://deb.nodesource.com/setup_15.x | bash -
RUN apt-get install -y nodejs
RUN npm install pm2 -g

COPY ./startup.sh /startup.sh
RUN chmod +x /startup.sh

RUN mkdir /appdata
RUN mkdir /appdata/user /appdata/chats
COPY ./avatar.jpg /appdata/user/avatar-default

CMD /startup.sh

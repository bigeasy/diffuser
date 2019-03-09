FROM node:alpine
MAINTAINER Alan Gutierrez <alan@wink.com>

WORKDIR /app

COPY package*.json .

RUN npm install --no-package-lock --no-save
RUN npm install --no-package-lock --no-save prolific.syslog wafer mingle.kubernetes

COPY ./ ./

FROM node:10-alpine
MAINTAINER Alan Gutierrez <alan@prettyrobots.com>

WORKDIR /app

COPY package*.json .

RUN npm install --no-package-lock --no-save
RUN npm install --no-package-lock --no-save prolific.syslog wafer mingle.kubernetes inlet.udp inlet.prolific prolific.udp

COPY ./ ./

ARG NODE_VERSION=25-alpine
ARG NGINX_VERSION=alpine3.23

#
# Build stage
#
FROM node:${NODE_VERSION} AS builder

WORKDIR /app

# copy package files first
COPY package*.json ./

# install dependencies
RUN npm ci

# copy the rest of the app code and build
COPY . .
RUN npm run build

#
# Release stage
#
FROM node:${NODE_VERSION} AS live

RUN addgroup -S secnotes && adduser -S secuser -G secnotes

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

# copy output from the build to default serving dir
COPY --from=builder /app/dist ./dist

RUN  chown -R secuser:secnotes /app

USER secuser

EXPOSE 1234

CMD [ "node", "dist/server.js" ]
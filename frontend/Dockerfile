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
FROM nginxinc/nginx-unprivileged:${NGINX_VERSION} AS live

# copy output from the build to default serving dir
COPY --chown=nginx:nginx --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx config 
COPY nginx.conf /etc/nginx/conf.d/default.conf

# use non root user
USER nginx

# default nginx container listens at 8080
EXPOSE 8080
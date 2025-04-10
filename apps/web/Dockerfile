# syntax = docker/dockerfile:1

ARG NODE_VERSION=22.11.0
FROM node:${NODE_VERSION}-slim AS base

LABEL fly_launch_runtime="Remix"

RUN apt-get update -qq && \
  apt-get install --no-install-recommends -y build-essential node-gyp pkg-config python-is-python3

RUN npm install -g pnpm

FROM base AS builder

WORKDIR /app

COPY package.json ./

RUN pnpm install

COPY . .

RUN pnpm nx build web

FROM base

ENV NODE_ENV=production
WORKDIR /app

COPY --from=builder /app/apps/web/package.json ./

RUN pnpm install --prod

# Copy only what's needed to run the app
COPY --from=builder /app/apps/web/build ./build
COPY --from=builder /app/apps/web/public ./public
COPY --from=builder /app/apps/web/server.js ./
COPY --from=builder /app/.infisical.json ./

EXPOSE 3001
CMD [ "node", "server.js" ]

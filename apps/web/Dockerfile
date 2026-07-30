# syntax = docker/dockerfile:1

ARG NODE_VERSION=22.11.0
FROM node:${NODE_VERSION}-slim AS base

LABEL fly_launch_runtime="Remix"

RUN apt-get update -qq \
  && apt-get install -y --no-install-recommends \
   build-essential \
   node-gyp \
   pkg-config \
   python-is-python3 \
  && rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm

FROM base AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

# Build arguments for Sentry. DSN, project and release are per app and injected
# by the build action; org and auth token are shared across apps.
# Required by the Sentry vite plugin to upload source maps, and by the client
# bundle which reads the VITE_ prefixed copies.
# These stay in the builder stage and are not part of the final image.
ARG DEPLOY_ENV
ARG SENTRY_AUTH_TOKEN
ARG SENTRY_DSN
ARG SENTRY_ORG
ARG SENTRY_PROJECT
ARG SENTRY_RELEASE

ENV SENTRY_AUTH_TOKEN=$SENTRY_AUTH_TOKEN \
    SENTRY_ORG=$SENTRY_ORG \
    SENTRY_PROJECT=$SENTRY_PROJECT \
    SENTRY_RELEASE=$SENTRY_RELEASE \
    SENTRY_DSN=$SENTRY_DSN \
    VITE_SENTRY_DSN=$SENTRY_DSN \
    VITE_SENTRY_RELEASE=$SENTRY_RELEASE \
    VITE_DEPLOY_ENV=$DEPLOY_ENV

ENV NX_NO_CLOUD=true

# The Sentry vite plugin skips source map upload entirely unless NODE_ENV is
# 'production' — it logs "Running in development mode" and silently does nothing.
# Must come after `pnpm install` above, which needs devDependencies.
ENV NODE_ENV=production

RUN pnpm nx build web

FROM base

ENV NODE_ENV=production
WORKDIR /app

# Build metadata surfaced by the About UI (version is inlined from package.json
# at build time; sha + build time are injected as build args on deploy).
ARG APP_SHA
ARG APP_BUILD_TIME
ENV APP_SHA=$APP_SHA \
    APP_BUILD_TIME=$APP_BUILD_TIME

COPY --from=builder /app/apps/web/package.json /app/apps/web/pnpm-lock.yaml ./

# Install runtime deps reproducibly from the committed lockfile so the image
# ships the exact versions the workspace built against (build == runtime).
# apps/web/package.json + pnpm-lock.yaml are kept in sync with the root
# workspace by `nx sync` (dev-plugin:web-package-sync).
RUN pnpm install --prod --no-optional --frozen-lockfile \
  && pnpm store prune \
  && STORE_PATH="$(pnpm store path --silent)" \
  && rm -rf "$STORE_PATH"

# Copy only what's needed to run the app
COPY --from=builder /app/apps/web/build ./build
COPY --from=builder /app/apps/web/public ./public
COPY --from=builder /app/apps/web/server.js ./
COPY --from=builder /app/.infisical.json ./

EXPOSE 3001
CMD [ "node", "server.js" ]

FROM node:20-bullseye-slim AS base

FROM base AS deps
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
    git \
    python3 \
    make \
    g++ \
    libc6-dev \
    libvips-dev \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY package.json ./

# Check the link regarding legacy-peer-deps
# https://payloadcms.com/docs/getting-started/installation#1-install-the-relevant-packages
RUN npm i --legacy-peer-deps

# Copy the dependencies to builder stage.
# Lock file is important for Nx to calculate a correct project graph.
FROM base AS builder

# Install ca-certificates for SSL verification during build (required for Sentry source map upload)
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=deps /app/node_modules      ./node_modules
COPY --from=deps /app/package-lock.json ./package-lock.json
COPY . .

# The lock file is hidden from the build process when included in the .gitignore file.
# Since package-lock.json is needed when building the app, we'll remove it from .gitignore.
RUN sed -i '/package-lock.json/d' .gitignore

# Build arguments for Next.js client-side environment variables
# These are embedded in the JavaScript bundle during build
ARG NEXT_PUBLIC_DEPLOY_ENV
ARG NEXT_PUBLIC_SENTRY_DSN
ARG NEXT_PUBLIC_SENTRY_RELEASE

# Build arguments for Sentry source map upload
# Required by Sentry webpack plugin during build (not persisted in final image)
ARG SENTRY_AUTH_TOKEN
ARG SENTRY_ORG
ARG SENTRY_PROJECT
ARG SENTRY_RELEASE

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Comment the following line in case you want to enable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED=1

# Convert Sentry ARGs to ENV so the webpack plugin can upload source maps
# These are only in the builder stage, not in the final deployed image
ENV SENTRY_AUTH_TOKEN=$SENTRY_AUTH_TOKEN \
    SENTRY_ORG=$SENTRY_ORG \
    SENTRY_PROJECT=$SENTRY_PROJECT \
    SENTRY_RELEASE=$SENTRY_RELEASE

RUN npx nx build cms

# Production image, copy all the files and run next
FROM base AS runner

# Install ca-certificates for SSL verification (required for Sentry, external APIs, etc.)
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV production
# Disable telemetry during runtime.
ENV NEXT_TELEMETRY_DISABLED 1

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/apps/cms/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/cms/.next/static     ./apps/cms/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/cms/public           ./apps/cms/public

# Change module type to commonjs to ensure compatibility with standalone build output.
# Next.js copies the root package.json during build without the possibility to set the module type.
RUN sed -i 's/"type": "module"/"type": "commonjs"/' package.json

# Set the correct ownership
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT 3000

ENV HOSTNAME="0.0.0.0"
CMD ["node", "apps/cms/server.js"]

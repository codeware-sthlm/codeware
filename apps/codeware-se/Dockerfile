# NextJS standalone build to get a much smaller deploy.
# Issue: https://github.com/nrwl/nx/issues/9017
#
# Based on Dockerfile suggested by a contributor:
# https://github.com/nrwl/nx/issues/9017#issuecomment-1140066503

FROM node:22-alpine AS base

RUN apt-get update -qq && \
  apt-get install --no-install-recommends -y build-essential node-gyp pkg-config python-is-python3

RUN npm install -g pnpm

FROM base AS builder

WORKDIR /app

COPY package.json ./

RUN pnpm install

COPY . .

RUN pnpm nx build codeware-se

FROM base

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/dist/apps/codeware-se/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/dist/apps/codeware-se/.next/static ./dist/apps/codeware-se/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/dist/apps/codeware-se/public ./apps/codeware-se/public

USER nextjs

EXPOSE 8080
CMD [ "node", "apps/codeware-se/server.js" ]

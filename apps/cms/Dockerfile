FROM node:22-slim AS base

FROM base AS builder

WORKDIR /app

# Copy package.json first to leverage Docker cache for dependencies
COPY package.json ./

RUN npm install

COPY . .

# The lock file is needed when building the app so remove it from `.gitignore`
RUN sed -i '/package-lock.json/d' .gitignore

RUN npx nx build cms

FROM base

ENV NODE_ENV=production
# Path is relative to workdir, where `node` is invoked
ENV PAYLOAD_CONFIG_PATH="dist/apps/cms/server/apps/cms/src/payload.config.js"

WORKDIR /app

COPY --from=builder /app/dist/apps/cms/package.json ./

RUN npm install --omit=dev

COPY --from=builder /app/dist               ./dist
COPY --from=builder /app/.infisical.json    ./
# Needed as part of the tsconfig paths workaround (and it's not pretty?)
# Must be located in "workspace root" to keep Nx project references working
COPY --from=builder /app/tsconfig.base.json ./dist/apps/cms/server/

EXPOSE 3000
CMD ["node", "dist/apps/cms/server/main.js"]

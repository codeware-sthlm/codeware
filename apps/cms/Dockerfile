FROM node:22-alpine AS base

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
ENV PAYLOAD_CONFIG_PATH="dist/payload.config.js"

WORKDIR /app

COPY --from=builder /app/dist/apps/cms/package.json ./

RUN npm install --omit=dev

COPY --from=builder /app/dist/apps/cms/src   ./dist
COPY --from=builder /app/dist/apps/cms/build ./dist/apps/cms/build
COPY --from=builder /app/.infisical.json     ./

EXPOSE 3000
CMD ["node", "dist/main.js"]

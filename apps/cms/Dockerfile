
FROM node:20-alpine as base

FROM base as builder

ARG MONGO_URL
ARG NODE_ENV
ARG PAYLOAD_PUBLIC_SERVER_URL
ARG PORT

ENV MONGO_URL=${MONGO_URL}
ENV NODE_ENV=${NODE_ENV}
ENV PAYLOAD_PUBLIC_SERVER_URL=${PAYLOAD_PUBLIC_SERVER_URL}
ENV PORT=${PORT}

WORKDIR /app

COPY package.json ./
RUN bun install

COPY . .

RUN bun nx build cms --no-cloud

# We'll create a structure similar to scaffolding a default payload workspace.
# Admin build output should match `buildPath` in payload.config.ts.
FROM base as runtime

ENV NODE_ENV production

WORKDIR /app

COPY --from=builder /app/dist/apps/cms/package.json ./
RUN bun install

COPY --from=builder /app/dist/apps/cms/src   ./dist
COPY --from=builder /app/dist/apps/cms/build ./dist/apps/cms/build

EXPOSE 3000

CMD ["node", "dist/main.js"]

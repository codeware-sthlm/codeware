FROM node:22-alpine AS base

FROM base AS builder

ARG MONGO_URL
ARG NODE_ENV
ARG PAYLOAD_PUBLIC_SERVER_URL
ARG PORT

ENV MONGO_URL=${MONGO_URL}
ENV NODE_ENV=${NODE_ENV}
ENV PAYLOAD_PUBLIC_SERVER_URL=${PAYLOAD_PUBLIC_SERVER_URL}
ENV PORT=${PORT}

WORKDIR /app

# Copy package.json first to leverage Docker cache for dependencies
COPY package.json ./
RUN npm install

COPY . .

RUN npx nx build cms

FROM base AS runtime

ENV NODE_ENV=production

WORKDIR /app

COPY --from=builder /app/dist/apps/cms/package.json ./
RUN npm install --production

COPY --from=builder /app/dist/apps/cms/src ./dist
COPY --from=builder /app/dist/apps/cms/build ./dist/apps/cms/build

EXPOSE 3000

CMD ["node", "dist/main.js"]
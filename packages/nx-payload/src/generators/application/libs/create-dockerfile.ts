import type { Tree } from '@nx/devkit';

import type { NormalizedSchema } from './normalize-options';

/**
 * Create the application Dockerfile supporting `npm` package manager
 */
export function createDockerfile(host: Tree, options: NormalizedSchema): void {
  const { directory, name } = options;

  const content = `
FROM node:20-alpine as base

FROM base as builder

ARG MONGO_URL
ARG NODE_ENV
ARG PAYLOAD_PUBLIC_SERVER_URL
ARG PORT

ENV MONGO_URL=\${MONGO_URL}
ENV NODE_ENV=\${NODE_ENV}
ENV PAYLOAD_PUBLIC_SERVER_URL=\${PAYLOAD_PUBLIC_SERVER_URL}
ENV PORT=\${PORT}

WORKDIR /app

COPY package.json ./

RUN npm config ls
RUN npm install

COPY . .

# Fix for pnpm workspaces (remove it when not applicable):
# The lock file is hidden from the build process when included in the .gitignore file.
# Since package-lock.json is needed when building the app, we'll remove it from .gitignore.
RUN sed -i '/package-lock.json/d' .gitignore

RUN npx nx build ${name}

# We'll create a structure similar to scaffolding a default payload workspace.
# Admin build output should match \`buildPath\` in payload.config.ts.
FROM base as runtime

ENV NODE_ENV production

WORKDIR /app

COPY --from=builder /app/dist/${directory}/package.json ./

RUN npm install --omit=dev

COPY --from=builder /app/dist/${directory}/src   ./dist
COPY --from=builder /app/dist/${directory}/build ./dist/${directory}/build

EXPOSE 3000

CMD ["node", "dist/main.js"]
`;

  host.write(`${directory}/Dockerfile`, content);
}

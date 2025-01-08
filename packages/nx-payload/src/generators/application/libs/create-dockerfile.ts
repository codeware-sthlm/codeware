import type { Tree } from '@nx/devkit';

import type { NormalizedSchema } from './normalize-options';

/**
 * Create the application Dockerfile supporting `npm` package manager
 */
export function createDockerfile(host: Tree, options: NormalizedSchema): void {
  const { directory, name } = options;

  const content = `
FROM node:22-alpine as base

FROM base as builder

WORKDIR /app

COPY package.json ./

RUN npm install

COPY . .

# Fix for pnpm workspaces (remove it when not applicable):
# The lock file is hidden from the build process when included in the .gitignore file.
# Since package-lock.json is needed when building the app, we'll remove it from .gitignore.
RUN sed -i '/package-lock.json/d' .gitignore

RUN npx nx build ${name}

FROM base as runtime

ENV NODE_ENV production
ENV PAYLOAD_CONFIG_PATH="dist/server/${directory}/src/payload.config.js"

WORKDIR /app

COPY --from=builder /app/dist/${directory}/package.json ./

RUN npm install --omit=dev

COPY --from=builder /app/dist/${directory} ./dist

EXPOSE 3000
CMD ["node", "dist/server/main.js"]
`;

  host.write(`${directory}/Dockerfile`, content);
}

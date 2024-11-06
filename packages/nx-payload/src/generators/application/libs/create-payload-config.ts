import { type Tree } from '@nx/devkit';

import { type NormalizedSchema } from './normalize-options';

/**
 * Create `payload.config.ts`
 */
export function createPayloadConfig(
  host: Tree,
  options: NormalizedSchema
): void {
  const { database, directory } = options;

  let importDbAdapter = '';
  let configDb = '';

  if (database === 'mongodb') {
    importDbAdapter = `import { mongooseAdapter } from '@payloadcms/db-mongodb';`;
    configDb = `db: mongooseAdapter({
  url: String(process.env.MONGO_URL),
  migrationDir: resolve(__dirname, 'migrations'),
}),`;
  } else {
    importDbAdapter = `import { postgresAdapter } from '@payloadcms/db-postgres';`;
    configDb = `db: postgresAdapter({
  pool: { connectionString: process.env.POSTGRES_URL },
  migrationDir: resolve(__dirname, 'migrations'),
}),`;
  }

  const content = `
import { resolve } from 'path';
import { cwd } from 'process';

import { webpackBundler } from '@payloadcms/bundler-webpack';
${importDbAdapter}
import { slateEditor } from '@payloadcms/richtext-slate';
import { buildConfig } from 'payload/config';

import Users from './collections/Users';

export default buildConfig({
  admin: {
    bundler: webpackBundler(),
    user: Users.slug,
    buildPath: resolve(cwd(), 'dist/${directory}/build')
  },
  collections: [Users],
  ${configDb}
  editor: slateEditor({}),
  typescript: {
    outputFile: resolve(__dirname, 'generated/payload-types.ts')
  },
  graphQL: {
    disable: false,
    schemaOutputFile: resolve(__dirname, 'generated/schema.graphql')
  },
  telemetry: false
});
`;

  host.write(`${directory}/src/payload.config.ts`, content);
}

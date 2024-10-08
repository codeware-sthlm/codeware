import { resolve } from 'path';
import { cwd } from 'process';

import { webpackBundler } from '@payloadcms/bundler-webpack';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { slateEditor } from '@payloadcms/richtext-slate';
import { buildConfig } from 'payload/config';

import Users from './collections/Users';

export default buildConfig({
  admin: {
    bundler: webpackBundler(),
    user: Users.slug,
    buildPath: resolve(cwd(), 'dist/apps/cms/build'),
  },
  collections: [Users],
  db: postgresAdapter({
    pool: { connectionString: process.env.POSTGRES_URL },
    migrationDir: resolve(__dirname, 'migrations'),
  }),
  editor: slateEditor({}),
  typescript: {
    outputFile: resolve(__dirname, 'generated/payload-types.ts'),
  },
  graphQL: {
    disable: false,
    schemaOutputFile: resolve(__dirname, 'generated/schema.graphql'),
  },
  telemetry: false,
});

import { resolve } from 'path';

import { webpackBundler } from '@payloadcms/bundler-webpack';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { slateEditor } from '@payloadcms/richtext-slate';
import { buildConfig } from 'payload/config';

import Pages from './collections/Pages';
import Users from './collections/Users';
import env from './env';

export default buildConfig({
  admin: {
    bundler: webpackBundler(),
    user: Users.slug,
    buildPath: resolve(__dirname, '../../..', 'dist/apps/cms/build'),
    dateFormat: 'yyyy-MM-dd HH:mm:ss'
  },
  collections: [Pages, Users],
  cors: ['http://localhost:4200'],
  db: postgresAdapter({
    pool: { connectionString: env.POSTGRES_URL },
    migrationDir: resolve(__dirname, 'migrations')
  }),
  editor: slateEditor({}),
  i18n: {
    fallbackLng: 'sv'
  },
  localization: {
    locales: [
      {
        label: {
          en: 'English',
          sv: 'Engelska'
        },
        code: 'en'
      },
      {
        label: {
          en: 'Swedish',
          sv: 'Svenska'
        },
        code: 'sv'
      }
    ],
    defaultLocale: 'sv',
    fallback: true
  },
  typescript: {
    declare: false,
    outputFile: resolve(__dirname, 'generated/payload-types.ts')
    // NB! Manually copy the generated file to the shared/util/payload/src/lib/generated folder
    // to keep the generated types in sync between the apps! To be fixed in COD-204
    // outputFile: resolve(
    //   process.cwd(),
    //   'libs/shared/util/payload/src/lib/generated/payload-types.ts'
    // )
  },
  graphQL: {
    disable: true
  },
  telemetry: false
});

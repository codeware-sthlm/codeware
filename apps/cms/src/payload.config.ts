import { resolve } from 'path';

import { webpackBundler } from '@payloadcms/bundler-webpack';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { buildConfig } from 'payload/config';

import Articles from './collections/Articles';
import Pages from './collections/Pages';
import Tenants from './collections/Tenants';
import Users from './collections/Users';
import env from './env-resolver/client.resolve';

export default buildConfig({
  admin: {
    bundler: webpackBundler(),
    user: Users.slug,
    buildPath: resolve(env.CWD, 'dist/apps/cms/build'),
    dateFormat: 'yyyy-MM-dd HH:mm:ss'
  },
  collections: [Articles, Pages, Tenants, Users],
  cors: [env.ALLOWED_URLS],
  db: postgresAdapter({
    pool: { connectionString: env.DATABASE_URL },
    migrationDir: resolve(__dirname, 'migrations')
  }),
  editor: lexicalEditor({}),
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

import { resolve } from 'path';

import { webpackBundler } from '@payloadcms/bundler-webpack';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { buildConfig } from 'payload/config';

import articles from './collections/articles/articles.collection';
import pages from './collections/pages/pages.collection';
import tenants from './collections/tenants/tenants.collection';
import users from './collections/users/users.collection';
import env from './env-resolver/resolved-env';
import { debugRequest } from './middlewares/debug-request';
import { setUserHostCookie } from './middlewares/set-user-host-cookie';

export default buildConfig({
  admin: {
    bundler: webpackBundler(),
    user: users.slug,
    buildPath: resolve(env.CWD, 'dist/apps/cms/build'),
    dateFormat: 'yyyy-MM-dd HH:mm:ss'
  },
  collections: [articles, pages, tenants, users],
  cors: [env.ALLOWED_URLS],
  db: postgresAdapter({
    pool: { connectionString: env.DATABASE_URL },
    migrationDir: resolve(__dirname, 'migrations')
  }),
  editor: lexicalEditor({}),
  express: {
    postMiddleware: [debugRequest, setUserHostCookie]
  },
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
  telemetry: false,
  debug: env.LOG_LEVEL === 'debug'
});

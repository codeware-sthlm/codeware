import path from 'path';
import { fileURLToPath } from 'url';

import { postgresAdapter } from '@payloadcms/db-postgres';
import { buildConfig } from 'payload';
import sharp from 'sharp';

import { getEnv } from '@codeware/app-cms/feature/env-loader';
import { seed } from '@codeware/app-cms/feature/seed';
import { defaultLexical } from '@codeware/app-cms/ui/fields';

import articles from './collections/articles/articles.collection';
import media from './collections/media/media.collection';
import pages from './collections/pages/pages.collection';
import tenants from './collections/tenants/tenants.collection';
import users from './collections/users/users.collection';
import { migrations } from './migrations';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const env = getEnv();

export default buildConfig({
  admin: {
    user: users.slug,
    dateFormat: 'yyyy-MM-dd HH:mm:ss',
    components: {
      beforeLogin: ['@payload-cms/components/NotifyInvalidHost'],
      beforeDashboard: ['@payload-cms/components/CheckValidHost'],
      graphics: {
        Logo: '@payload-cms/components/Logo'
      }
    }
  },
  collections: [articles, media, pages, tenants, users],
  cors: env.CORS_URLS === '*' ? '*' : env.CORS_URLS.split(',').filter(Boolean),
  csrf: env.CSRF_URLS.split(',').filter(Boolean),
  db: postgresAdapter({
    pool: {
      connectionString: env.DATABASE_URL
    },
    push: env.DISABLE_DB_PUSH === false,
    prodMigrations: migrations
  }),
  editor: defaultLexical,
  secret: env.PAYLOAD_SECRET_KEY,
  // i18n support
  i18n: { fallbackLanguage: 'sv' },
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
  // Invoke seed process on payload init
  onInit: async (payload) => {
    payload.logger.info('Payload is ready');
    await seed({
      environment: env.DEPLOY_ENV,
      payload,
      source: env.SEED_SOURCE,
      strategy: env.SEED_STRATEGY
    });
  },
  // Generate types and schemas
  typescript: {
    outputFile: path.resolve(
      dirname,
      '../../..',
      'libs/shared/util/payload-types/src/lib/payload-types.ts'
    )
  },
  graphQL: {
    disable: true,
    schemaOutputFile: path.resolve(dirname, 'generated', 'schema.graphql')
  },
  // Misc
  debug: env.LOG_LEVEL === 'debug',
  telemetry: false,
  sharp
});

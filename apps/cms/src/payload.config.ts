import path from 'path';
import { fileURLToPath } from 'url';

import { postgresAdapter } from '@payloadcms/db-postgres';
import { buildConfig } from 'payload';
import sharp from 'sharp';

import { getEnv } from '@codeware/app-cms/feature/env-loader';
import { seed } from '@codeware/app-cms/feature/seed';
import {
  codeBlock,
  contentBlock,
  formBlock,
  mediaBlock
} from '@codeware/app-cms/ui/blocks';
import { defaultLexical } from '@codeware/app-cms/ui/fields';
import { getEmailAdapter } from '@codeware/app-cms/util/email';
import { getPugins } from '@codeware/app-cms/util/plugins';

import categories from './collections/categories/categories.collection';
import media from './collections/media/media.collection';
import pages from './collections/pages/pages.collection';
import posts from './collections/posts/posts.collection';
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
      beforeDashboard: ['@codeware/app-cms/ui/components/VerifyTenantDomain'],
      beforeLogin: ['@codeware/app-cms/ui/components/RedirectNotifier'],
      graphics: {
        Logo: '@codeware/apps/cms/components/Logo.client'
      }
    }
  },
  // Declare blocks globally and reference then by slug elsewhere
  // https://payloadcms.com/docs/fields/blocks#block-references
  blocks: [codeBlock, contentBlock, formBlock, mediaBlock],
  collections: [categories, media, pages, posts, tenants, users],
  cors: env.CORS_URLS === '*' ? '*' : env.CORS_URLS.split(',').filter(Boolean),
  csrf: env.CSRF_URLS ? env.CSRF_URLS.split(',').filter(Boolean) : undefined,
  db: postgresAdapter({
    pool: {
      connectionString: env.DATABASE_URL
    },
    push: env.DISABLE_DB_PUSH === false,
    prodMigrations: migrations
  }),
  editor: defaultLexical,
  email: getEmailAdapter(env),
  plugins: getPugins(env),
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
    payload.logger.info(`Using ${payload.db.name} database adapter`);
    if (env.EMAIL?.ethereal) {
      payload.logger.info('Using Ethereal email adapter');
      payload.logger.info(`[ethereal] Inbox: https://ethereal.email/messages`);
      payload.logger.info(`[ethereal] Username: ${env.EMAIL.ethereal.user}`);
      payload.logger.info(`[ethereal] Password: ${env.EMAIL.ethereal.pass}`);
    }
    if (env.EMAIL?.sendgrid) {
      payload.logger.info('Using SendGrid email adapter');
    }
    if (!env.EMAIL) {
      payload.logger.info('Email is disabled');
    }

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
  hooks: {
    afterError: [
      ({ error, req, collection }) => {
        if (env.LOG_LEVEL === 'debug') {
          const { headers, href } = req;
          console.log(`[DEBUG|afterError] ${collection?.slug} | ${href}`);
          console.log(`[DEBUG|afterError] ${error}`);
          console.log(`[DEBUG|afterError]`, headers);
        }
      }
    ]
  },
  telemetry: false,
  sharp
});

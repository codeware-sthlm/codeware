import path from 'path';
import { fileURLToPath } from 'url';

import { postgresAdapter } from '@payloadcms/db-postgres';
import { en } from '@payloadcms/translations/languages/en';
import { sv } from '@payloadcms/translations/languages/sv';
import * as Sentry from '@sentry/nextjs';
import { getTenantFromCookie } from 'node_modules/@payloadcms/plugin-multi-tenant/dist/utilities/getTenantFromCookie';
import { buildConfig } from 'payload';
import sharp from 'sharp';

import { getEnv } from '@codeware/app-cms/feature/env-loader';
import { seed } from '@codeware/app-cms/feature/seed';
import {
  calloutBlock,
  cardBlock,
  codeBlock,
  contentBlock,
  featureCardsBlock,
  fileAreaBlock,
  formBlock,
  heroBlock,
  imageBlock,
  mediaBlock,
  pillListBlock,
  postsBlock,
  reusableContentBlock,
  showcaseBlock,
  socialMediaBlock,
  spacingBlock,
  videoBlock
} from '@codeware/app-cms/ui/blocks';
import { defaultLexical } from '@codeware/app-cms/ui/fields';
import { getEmailAdapter } from '@codeware/app-cms/util/email';
import { customTranslations } from '@codeware/app-cms/util/i18n';
import { isTenant, isUser } from '@codeware/app-cms/util/misc';
import { getPlugins } from '@codeware/app-cms/util/plugins';

import categories from './collections/categories/categories.collection';
import media from './collections/media/media.collection';
import navigation from './collections/navigation/navigation.collection';
import pages from './collections/pages/pages.collection';
import posts from './collections/posts/posts.collection';
import reusableContent from './collections/reusable-content/reusable-content.collection';
import siteSettings from './collections/site-settings/site-settings.collection';
import tags from './collections/tags/tags.collection';
import tenants from './collections/tenants/tenants.collection';
import users from './collections/users/users.collection';
import { tenantConfigEndpoint } from './endpoints/tenant-config';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const env = getEnv();

export default buildConfig({
  serverURL: env.APP_MODE.serverURL,
  admin: {
    user: users.slug,
    dateFormat: 'yyyy-MM-dd HH:mm:ss',
    components: {
      graphics: {
        Logo: '@codeware/apps/cms/components/Logo.client'
      }
    },
    livePreview: {
      breakpoints: [
        { label: 'Mobile', name: 'mobile', width: 375, height: 667 },
        { label: 'Tablet', name: 'tablet', width: 768, height: 1024 },
        { label: 'Desktop', name: 'desktop', width: 1440, height: 900 }
      ],
      collections: ['pages', 'posts'],
      url: ({ data, collectionConfig, locale }) => {
        // Live preview is not enabled in host mode
        if (env.APP_MODE.type === 'host') {
          return null;
        }
        const sitePath =
          collectionConfig?.slug === 'posts'
            ? `/posts/${data.slug}?locale=${locale.code}`
            : `/${data.slug}?locale=${locale.code}`;
        return `/api/preview?redirect=${encodeURIComponent(sitePath)}`;
      }
    }
  },
  // Declare blocks globally and reference then by slug elsewhere
  // https://payloadcms.com/docs/fields/blocks#block-references
  blocks: [
    calloutBlock,
    cardBlock,
    codeBlock,
    contentBlock,
    featureCardsBlock,
    fileAreaBlock,
    formBlock,
    heroBlock,
    imageBlock,
    mediaBlock,
    pillListBlock,
    postsBlock,
    reusableContentBlock,
    showcaseBlock,
    socialMediaBlock,
    spacingBlock,
    videoBlock
  ],
  collections: [
    categories,
    media,
    navigation,
    pages,
    posts,
    reusableContent,
    siteSettings,
    tags,
    tenants,
    users
  ],
  cors:
    env.CORS_URLS === '*'
      ? '*'
      : [
          env.FLY_URL ?? '', // Always allow the app's own Fly URL
          ...env.CORS_URLS.split(',')
        ].filter(Boolean),
  csrf: env.CSRF_URLS ? env.CSRF_URLS.split(',').filter(Boolean) : undefined,
  db: postgresAdapter({
    pool: {
      connectionString: env.DATABASE_URL
    },
    schemaName: env.DATABASE_SCHEMA,
    migrationDir: path.resolve(dirname, 'migrations'),
    // Ensure db push is disabled during build-time
    push: env.DISABLE_DB_PUSH === false && env.NX_RUN_TARGET !== 'build'
  }),
  editor: defaultLexical,
  email: getEmailAdapter(env),
  endpoints: [tenantConfigEndpoint],
  plugins: getPlugins(env),
  secret: env.PAYLOAD_SECRET_KEY,
  upload: { safeFileNames: true },
  // i18n support
  i18n: {
    fallbackLanguage: 'en',
    supportedLanguages: { en, sv },
    translations: customTranslations
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
    defaultLocale: 'en',
    fallback: true,
    // Filter available locales based on current tenant
    filterAvailableLocales: async ({ req, locales }) => {
      const tenantId = getTenantFromCookie(req.headers, 'text');
      if (tenantId) {
        const tenant = await req.payload.findByID({
          id: tenantId,
          collection: 'tenants',
          req
        });
        if (tenant && tenant.supportedLocales.length) {
          return locales.filter((locale) => {
            return tenant.supportedLocales.map(String).includes(locale.code);
          });
        }
      }
      return locales;
    }
  },
  // Act when Payload is initialized (after db connection, migrations, etc. are done)
  onInit: async (payload) => {
    if (env.NX_RUN_TARGET === 'build') {
      payload.logger.info(
        'Payload onInit skipped during build to prevent side effects'
      );
      return;
    }

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
    if (
      env.APP_MODE.type === 'host' ||
      env.NX_RUN_TARGET === 'seed' ||
      (env.APP_MODE.type === 'tenant' && env.DEPLOY_ENV === 'development')
    ) {
      // Run seeding for app cms host, on demand via cli or for tenants in development
      await seed({
        environment: env.DEPLOY_ENV,
        payload,
        remoteDataUrl: env.SEED_DATA_URL,
        source: env.SEED_SOURCE,
        strategy: env.SEED_STRATEGY
      });
    } else if (env.APP_MODE.type === 'tenant') {
      payload.logger.info(
        'Skipping seeding for tenant mode in non-development environment'
      );
    }
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
  sharp,
  // Capture Payload errors in Sentry (same as payload sentry plugin brings)
  hooks: {
    afterError: [
      async ({ collection, error, req: { headers, payload, user } }) => {
        const status =
          'status' in error && typeof error.status === 'number'
            ? error.status
            : 500;

        // Capture server errors (500+)
        if (status >= 500) {
          const email = isUser(user) ? user.email : 'n/a';
          const tenant_slug = isTenant(user) ? user.slug : '';
          const context: Sentry.ExclusiveEventHintOrCaptureContext = {
            extra: {
              errorCollectionSlug: collection?.slug
            },
            ...(user && {
              user: {
                id: user.id,
                collection: user.collection,
                name: user.name,
                email,
                tenant_slug,
                ip_address:
                  // Extract only the first IP address in case the request passes through multiple proxies
                  headers?.get('X-Forwarded-For')?.split(',')[0]?.trim() ??
                  undefined
              }
            })
          };

          const eventId = Sentry.captureException(error, context);

          if (env.LOG_LEVEL === 'debug') {
            payload.logger.info(
              `Captured Payload exception ${eventId} to Sentry: ${error.message}`
            );
          }
        }
      }
    ]
  }
});

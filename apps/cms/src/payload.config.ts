import { resolve } from 'path';

import { CdwrAdminLogo } from '@codeware/shared/ui/react-components';
import { webpackBundler } from '@payloadcms/bundler-webpack';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { buildConfig } from 'payload/config';

import articles from './collections/articles/articles.collection';
import pages from './collections/pages/pages.collection';
import tenants from './collections/tenants/tenants.collection';
import users from './collections/users/users.collection';
import env from './env-resolver/resolved-env';
import { authorizationFix } from './middlewares/authorization-fix';
import { debugRequest } from './middlewares/debug-request';
import { setUserHostCookie } from './middlewares/set-user-host-cookie';
import { verifyClientRequest } from './middlewares/verify-client-request';
import { resolveTsconfigPathsToAlias } from './utils/resolve-tsconfig-paths-to-alias';

export default buildConfig({
  // Required base configuration
  admin: {
    bundler: webpackBundler(),
    user: users.slug,
    // Always located relative to workspace root (where command is invoked)
    buildPath: resolve(env.CWD, 'dist/apps/cms/build'),
    dateFormat: 'yyyy-MM-dd HH:mm:ss',
    components: {
      graphics: {
        Logo: CdwrAdminLogo
      }
    },
    webpack: (config) => ({
      ...config,
      resolve: {
        ...(config.resolve ?? {}),
        alias: {
          ...(config.resolve?.alias ?? {}),
          // Support workspace path mappings
          ...resolveTsconfigPathsToAlias(
            // Find tsconfig.base.json where the command is invoked:
            // - `nx` is executed from the workspace root
            // - `node` is executed from the Docker WORKDIR
            resolve(env.CWD, 'tsconfig.base.json'),
            // Webpack workspace context is by design always relative to this file,
            // i.e. the workspace root or compiled workspace root
            resolve(__dirname, '../../..'),
            // Override aliases for pre-built custom admin components
            {
              '@codeware/shared/ui/react-components': resolve(
                env.CWD,
                'dist/apps/cms/server/libs/shared/ui/react-components/src/index.js'
              )
            }
          ),

          // Disable server-only modules in client bundle
          fs: false,
          process: false
        }
      }
    })
  },
  collections: [articles, pages, tenants, users],
  db: postgresAdapter({
    pool: { connectionString: env.DATABASE_URL },
    migrationDir: resolve(__dirname, 'migrations')
  }),
  editor: lexicalEditor({}),
  // Express middlewares
  express: {
    preMiddleware: [debugRequest, authorizationFix],
    postMiddleware: [verifyClientRequest, setUserHostCookie]
  },
  // Security customizations
  cors: env.CORS_URLS === '*' ? '*' : env.CORS_URLS.split(',').filter(Boolean),
  csrf: env.CSRF_URLS.split(',').filter(Boolean),
  maxDepth: 5,
  rateLimit: {
    max: 10000, // limit each IP per windowMs
    trustProxy: true, // hosted behind nginx (reverse proxy)
    window: 2 * 60 * 1000 // 2 minutes
  },
  // i18n support
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
  // Generate types and schemas
  typescript: {
    declare: false,
    // Keep the generated types in sync between the apps
    outputFile: resolve(
      env.CWD,
      'libs/shared/util/payload/src/lib/generated/payload-types.ts'
    )
  },
  graphQL: {
    disable: true
  },
  // Debugging
  debug: env.LOG_LEVEL === 'debug',
  telemetry: false
});

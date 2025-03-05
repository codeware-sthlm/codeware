import type { Env } from '@codeware/app-cms/util/env-schema';
import type { Page, Post } from '@codeware/shared/util/payload-types';
import { seoPlugin } from '@payloadcms/plugin-seo';
import type { GenerateTitle, GenerateURL } from '@payloadcms/plugin-seo/types';
import { s3Storage } from '@payloadcms/storage-s3';
import type { Plugin } from 'payload';

/**
 * Get the Payload plugins.
 *
 * @param env - The environment variables
 * @returns Array of plugins
 */
export const getPugins = (env: Env): Array<Plugin> => {
  // SEO auto-generate functions
  const generateTitle: GenerateTitle<Page | Post> = async ({ doc }) =>
    'name' in doc ? doc.name : doc.title;
  const generateURL: GenerateURL<Page | Post> = async ({
    collectionSlug,
    doc,
    req: { origin }
  }) => `${origin}/${collectionSlug}/${doc.slug ?? ''}`;

  // S3 storage configuration.
  // Important!
  // Plugins that have components must always be enabled.
  // Otherwise those components will not be generated in `importMap.js`.
  // To support run-time enable/disable, we can force all plugins to be enabled for some Nx targets.
  // Hopefully this will be adressed by Payload to make `importMap.js` include all defined plugins by default.
  const s3 = (env.S3_STORAGE ?? {}) as NonNullable<typeof env.S3_STORAGE>;
  const s3Enabled =
    Boolean(s3.bucket) ||
    // TODO: Running `dev` target without S3 will trigger db sync to remove prefix column from media collection.
    // Until this is fixed (by Payload?) it's better to use S3 for develpment as well.
    ['build', 'gen', 'payload'].includes(env.NX_TASK_TARGET_TARGET);

  return [
    // SEO
    seoPlugin({
      uploadsCollection: 'media',
      generateTitle,
      generateURL
    }),

    // S3 Storage
    s3Storage({
      collections: {
        media: {
          disableLocalStorage: true,
          prefix: 'media'
        }
      },
      bucket: s3.bucket,
      config: {
        credentials: {
          accessKeyId: s3.credentials?.accessKeyId,
          secretAccessKey: s3.credentials?.secretAccessKey
        },
        forcePathStyle: s3.forcePathStyle,
        region: s3.region,
        endpoint: s3.endpoint
      },
      enabled: s3Enabled
    })
  ];
};

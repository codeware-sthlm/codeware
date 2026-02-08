import type { Env } from '@codeware/app-cms/util/env-schema';
import { s3Storage } from '@payloadcms/storage-s3';

export const getS3StoragePlugin = (env: Env) => {
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
    ['build', 'gen', 'payload'].includes(env.NX_RUN_TARGET);

  return s3Storage({
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
  });
};

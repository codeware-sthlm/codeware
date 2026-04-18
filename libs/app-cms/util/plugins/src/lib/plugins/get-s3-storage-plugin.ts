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
    ['build', 'gen', 'payload'].includes(env.NX_RUN_TARGET);

  return s3Storage({
    collections: {
      media: {
        // Only disable local storage when S3 is actually configured.
        // Without this guard, Payload has nowhere to store files when S3 is disabled.
        disableLocalStorage: Boolean(s3.bucket)
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

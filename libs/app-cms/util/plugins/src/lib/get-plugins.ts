import type { Env } from '@codeware/app-cms/util/env-schema';
import type { Plugin } from 'payload';

import { getFormsPlugin } from './plugins/get-forms-plugin';
import { getMultiTenantPlugin } from './plugins/get-multi-tenant-plugin';
import { getS3StoragePlugin } from './plugins/get-s3-storage-plugin';
import { getSeoPlugin } from './plugins/get-seo-plugin';

/**
 * Get the Payload plugins.
 *
 * @param env - The environment variables
 * @returns Array of plugins
 */
export const getPugins = (env: Env): Array<Plugin> => [
  getFormsPlugin(),
  getMultiTenantPlugin(),
  getSeoPlugin(),
  getS3StoragePlugin(env)
];

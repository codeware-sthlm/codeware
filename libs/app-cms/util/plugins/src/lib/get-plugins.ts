import type { Env } from '@codeware/app-cms/util/env-schema';
import type { Access, Plugin } from 'payload';

import { getFormsPlugin } from './plugins/get-forms-plugin';
import { getMultiTenantPlugin } from './plugins/get-multi-tenant-plugin';
import { getS3StoragePlugin } from './plugins/get-s3-storage-plugin';
import { getSeoPlugin } from './plugins/get-seo-plugin';

type Options = {
  /**
   * Tenant scoped access control applied to the form submissions collection
   * added by the forms plugin.
   */
  submissionAccess: Access;
};

/**
 * Get the Payload plugins.
 *
 * @param env - The environment variables
 * @param options - Access controls owned by the app
 * @returns Array of plugins
 */
export const getPlugins = (
  env: Env,
  { submissionAccess }: Options
): Array<Plugin> => [
  getFormsPlugin({ submissionAccess }),
  getMultiTenantPlugin(),
  getSeoPlugin(),
  getS3StoragePlugin(env)
];

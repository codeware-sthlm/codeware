import { TenantRuntimeConfig } from '@codeware/shared/util/payload-types';

import { invokeRequest } from './utils/invoke-request';
import type { RequestBaseOptions } from './utils/types';

export async function getTenantConfig(
  options: RequestBaseOptions
): Promise<TenantRuntimeConfig | null> {
  const response = await invokeRequest('tenant-config', {
    ...options,
    method: 'GET'
  });

  if ('error' in response) {
    throw new Error(`Error fetching tenant config: ${response.error}`);
  }

  return response.data;
}

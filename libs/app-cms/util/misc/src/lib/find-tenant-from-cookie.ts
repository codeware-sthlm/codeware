import { Tenant } from '@codeware/shared/util/payload-types';
import { getTenantFromCookie } from '@payloadcms/plugin-multi-tenant/utilities';
import { PayloadRequest } from 'payload';

/**
 * Utility function to find the tenant based on the tenant ID stored in a cookie.
 * @param req - The Payload request
 * @return The tenant object if found, otherwise null
 */
export const findTenantFromCookie = async (
  req: PayloadRequest
): Promise<Tenant | null> => {
  const { headers, payload } = req;

  const tenantId = getTenantFromCookie(headers, 'text');
  if (!tenantId) {
    return null;
  }

  try {
    const tenant = await payload.findByID({
      collection: 'tenants',
      id: tenantId,
      req
    });

    return tenant || null;
  } catch (error) {
    console.error(
      'Error fetching tenant:',
      error instanceof Error ? error.message : error
    );
    return null;
  }
};

import type { Tenant } from '@codeware/shared/util/payload-types';

/** Check if a value is a Tenant object. */
export const isTenantObject = (user: number | Tenant): user is Tenant => {
  return !!user && typeof user === 'object';
};

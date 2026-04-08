// eslint-disable-next-line @nx/enforce-module-boundaries
import type { Tenant } from '@codeware/shared/util/payload-types';

export const resolveTenantId = (user: number | Tenant): number => {
  return !!user && typeof user === 'object' ? user.id : user;
};

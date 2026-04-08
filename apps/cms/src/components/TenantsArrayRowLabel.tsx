import { getTenant } from '@codeware/app-cms/data-access';

import type { FieldComponentServer } from './component-types';

/**
 * Custom array row label for the tenants array field.
 *
 * Displays the tenant name instead of the default row number.
 */
export const TenantsArrayRowLabel: FieldComponentServer<'RowLabel'> = async ({
  payload,
  path,
  formState,
  rowLabel,
  rowNumber
}) => {
  // TODO: Can this be type safe?
  const tenantPath = `${path}.${Number(rowNumber ?? 0) - 1}.tenant`;
  const tenantId = formState[tenantPath]?.value as number;

  const tenant = await getTenant(payload, tenantId);
  if (tenant) {
    return tenant.name;
  }

  // Fall back to the default label if the tenant is not found
  return rowLabel;
};

export default TenantsArrayRowLabel;

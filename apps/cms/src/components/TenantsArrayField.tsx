import { ArrayField } from '@payloadcms/ui';
import type { ArrayFieldServerComponent } from 'payload';

import { getUserTenantIDs, hasRole } from '@codeware/app-cms/util/misc';

/**
 * Custom server component for the tenants array field.
 *
 * This component is used to limit the number of rows
 * a tenant admin can add based on the number of tenants they administer.
 *
 * The desired effect is that the "add workspace" button is hidden
 * when the tenant admin has added all tenants they administer.
 */
export const TenantsArrayField: ArrayFieldServerComponent = ({
  clientField,
  path,
  schemaPath,
  user,
  permissions
}) => {
  const tenantIds = getUserTenantIDs(user, 'admin').length;

  if (!hasRole(user, 'system-user') && tenantIds > 0) {
    clientField.maxRows = tenantIds;
  }

  return (
    <ArrayField
      field={clientField}
      path={path}
      schemaPath={schemaPath}
      permissions={permissions}
    />
  );
};

export default TenantsArrayField;

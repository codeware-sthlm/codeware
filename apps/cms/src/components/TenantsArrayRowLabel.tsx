import { ArrayRowLabel } from './array-row-label.type';

/**
 * Custom array row label for the tenants array field.
 *
 * Displays the tenant name instead of the default row number.
 */
export const TenantsArrayRowLabel: React.FC<ArrayRowLabel> = async (props) => {
  const { payload, path, formState, rowLabel, rowNumber } = props;

  // TODO: Can this be type safe?
  const tenantPath = `${path}.${Number(rowNumber ?? 0) - 1}.tenant`;
  const tenantId = formState[tenantPath]?.value as number;

  const tenant = await payload.findByID({
    collection: 'tenants',
    id: tenantId ?? 0,
    depth: 0,
    disableErrors: true
  });

  if (!tenant) {
    // Fall back to the default label if the tenant is not found
    return <div>{rowLabel}</div>;
  }

  return <div>{tenant.name}</div>;
};

export default TenantsArrayRowLabel;

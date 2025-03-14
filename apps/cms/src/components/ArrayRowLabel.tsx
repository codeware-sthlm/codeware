import type { RowLabelProps } from '@payloadcms/ui';
import type { ArrayFieldServerProps } from 'payload';
import React from 'react';

/**
 * Custom array row label for the tenants array field.
 *
 * Displays the tenant name instead of the default row number.
 */
export const ArrayRowLabel: React.FC<
  // Couldn't find a dedicated type?
  ArrayFieldServerProps &
    Pick<RowLabelProps, 'rowNumber'> & { rowLabel: string }
> = async (props) => {
  const { payload, path, formState, rowLabel, rowNumber } = props;

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

export default ArrayRowLabel;

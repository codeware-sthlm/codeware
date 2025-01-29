import type { Field } from 'payload/types';

import { anyone } from '../../access/anyone';

import { canCreateTenant } from './access/can-create-tenant';
import { canUpdateTenant } from './access/can-update-tenant';
import { showTenantField } from './conditions/show-tenant-field';
import { autofillTenant } from './hooks/autofill-tenant';

/** The name of the tenant field */
export const tenantName = 'tenant' as const;

/**
 * A field that infers tenant support on collections.
 */
export const tenant: Field = {
  name: tenantName,
  type: 'relationship',
  relationTo: 'tenants',
  hasMany: false,
  index: true,
  label: {
    en: 'Workspace',
    sv: 'Arbetsyta'
  },
  admin: {
    description: {
      en: 'The workspace this document belongs to.',
      sv: 'Arbetsytan som detta dokument tillhör.'
    },
    position: 'sidebar',
    condition: showTenantField
  },
  access: {
    read: anyone,
    create: canCreateTenant,
    update: canUpdateTenant
  },
  hooks: {
    beforeChange: [autofillTenant]
  }
};

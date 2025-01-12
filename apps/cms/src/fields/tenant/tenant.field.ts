import type { Field } from 'payload/types';

import { anyone } from '../../access/anyone';

import { canUpdateTenantField } from './access/can-update-tenant-field';
import { showTenantField } from './conditions/show-tenant-field';
import { autofillTenant } from './hooks/autofill-tenant';

/**
 * A field that infers tenant support on collections.
 */
export const tenant: Field = {
  name: 'tenant',
  type: 'relationship',
  relationTo: 'tenants',
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
    update: canUpdateTenantField
  },
  hooks: {
    beforeChange: [autofillTenant]
  }
};

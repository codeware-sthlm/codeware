import type { CollectionConfig } from 'payload';

import { systemUser } from '../../access/system-user';
import { slug } from '../../fields/slug/slug.field';

import { canReadTenant } from './access/can-read-tenant';
import { hideTenantsCollection } from './admin/hide-tenants-collection';
import { enforceApiKey } from './hooks/enforce-api-key';

/**
 * Tenants collection
 */
const tenants: CollectionConfig = {
  slug: 'tenants',
  auth: {
    useAPIKey: true,
    disableLocalStrategy: true
  },
  access: {
    create: systemUser,
    delete: systemUser,
    read: canReadTenant,
    update: systemUser
  },
  hooks: {
    beforeChange: [enforceApiKey]
  },
  admin: {
    useAsTitle: 'name',
    description: {
      en: 'A workspace works like an organization or a company, scoped to specific users and domains.',
      sv: 'En arbetsyta fungerar som en organisation eller ett företag, begränsad till specifika användare och domäner.'
    },
    hidden: hideTenantsCollection
  },
  labels: {
    singular: { en: 'Workspace', sv: 'Arbetsyta' },
    plural: { en: 'Workspaces', sv: 'Arbetsytor' }
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: { en: 'Name', sv: 'Namn' },
      required: true
    },
    {
      name: 'description',
      type: 'textarea',
      label: { en: 'Description', sv: 'Beskrivning' }
    },
    {
      name: 'domains',
      type: 'array',
      index: true,
      label: { en: 'Domains', sv: 'Domäner' },
      fields: [
        {
          name: 'domain',
          type: 'text',
          label: { en: 'Domain', sv: 'Domän' },
          required: true
        }
      ]
    },
    slug({ sourceField: 'name' })
  ]
};

export default tenants;

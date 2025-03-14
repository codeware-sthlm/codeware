import type { CollectionConfig } from 'payload';

import { slugField } from '@codeware/app-cms/ui/fields';
import {
  authenticatedAccess,
  systemUserAccess
} from '@codeware/app-cms/util/access';
import { hasRole } from '@codeware/app-cms/util/misc';

import { enforceApiKeyHook } from './hooks/enforce-api-key.hook';

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
    create: systemUserAccess,
    delete: systemUserAccess,
    read: authenticatedAccess,
    update: systemUserAccess
  },
  hooks: {
    beforeChange: [enforceApiKeyHook]
  },
  admin: {
    useAsTitle: 'name',
    description: {
      en: 'A workspace works like an organization or a company, scoped to specific users and domains.',
      sv: 'En arbetsyta fungerar som en organisation eller ett företag, begränsad till specifika användare och domäner.'
    },
    // Only system users can see the tenants collection
    hidden: ({ user }) => !hasRole(user, 'system-user')
  },
  labels: {
    singular: { en: 'Workspace', sv: 'Arbetsyta' },
    plural: { en: 'Workspaces', sv: 'Arbetsytor' }
  },
  fields: [
    // Customize the API key fields to be protected from being updated
    {
      name: 'enableAPIKey',
      type: 'checkbox',
      access: {
        update: () => false
      }
    },
    {
      name: 'apiKey',
      type: 'text',
      access: {
        update: () => false
      }
    },
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
      ],
      admin: {
        position: 'sidebar'
      }
    },
    slugField({ sourceField: 'name' })
  ]
};

export default tenants;

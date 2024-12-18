import { CollectionConfig } from 'payload/types';

import { isAdmin } from '../access/is-admin.access';
import { enforceApiKey } from '../hooks/enforce-api-key';

const Tenants: CollectionConfig = {
  slug: 'tenants',
  auth: {
    useAPIKey: true,
    disableLocalStrategy: true
  },
  access: {
    // Only allow access to admins (need a new elevated role?)
    read: isAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin
  },
  admin: {
    useAsTitle: 'name',
    description: {
      en: 'A workspace is a collection of users for a specific domain.',
      sv: 'En arbetsyta är en samling användare för en specifik domän.'
    }
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
    }
  ],
  hooks: {
    beforeChange: [enforceApiKey]
  }
};

export default Tenants;

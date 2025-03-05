import type { CollectionConfig } from 'payload';

import { slugField, tenantField } from '@codeware/app-cms/ui/fields';
import { canReadTenantScopeAccess } from '@codeware/app-cms/util/functions';

/**
 * Categories collection
 */
const categories: CollectionConfig = {
  slug: 'categories',
  admin: {
    defaultColumns: ['name', 'slug', 'tenant'],
    useAsTitle: 'name'
  },
  labels: {
    singular: { en: 'Category', sv: 'Kategori' },
    plural: { en: 'Categories', sv: 'Kategorier' }
  },
  access: {
    read: canReadTenantScopeAccess
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      localized: true,
      required: true,
      admin: {
        description: {
          en: 'The name of the category.',
          sv: 'Namnet på kategorin.'
        }
      }
    },
    slugField({ sourceField: 'name' }),
    tenantField
  ]
};

export default categories;

import type { CollectionConfig } from 'payload';

import { slugField } from '@codeware/app-cms/ui/fields';
import { adminGroups } from '@codeware/app-cms/util/definitions';

import { userOrApiKeyAccess } from '../../security/user-or-api-key-access';

/**
 * Categories collection
 */
const categories: CollectionConfig = {
  slug: 'categories',
  admin: {
    group: adminGroups.content,
    defaultColumns: ['name', 'slug'],
    useAsTitle: 'name'
  },
  access: {
    read: userOrApiKeyAccess()
  },
  labels: {
    singular: { en: 'Category', sv: 'Kategori' },
    plural: { en: 'Categories', sv: 'Kategorier' }
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      localized: true,
      required: true,
      label: { en: 'Name', sv: 'Namn' },
      admin: {
        description: {
          en: 'The name of the category.',
          sv: 'Namnet på kategorin.'
        }
      }
    },
    {
      type: 'group',
      name: 'relations',
      virtual: true,
      label: { en: 'The category is used here', sv: 'Här används kategorin' },
      fields: [
        {
          name: 'relatedPosts',
          label: { en: 'Related Posts', sv: 'Relaterade Inlägg' },
          type: 'join',
          collection: 'posts',
          on: 'categories',
          admin: { allowCreate: false, disableListColumn: true }
        }
      ]
    },
    slugField({ sourceField: 'name' })
  ]
};

export default categories;

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
      admin: {
        description: {
          en: 'The name of the category.',
          sv: 'Namnet på kategorin.'
        }
      }
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: { en: 'Posts', sv: 'Inlägg' },
          fields: [
            {
              name: 'relatedPosts',
              label: false,
              type: 'join',
              collection: 'posts',
              on: 'categories',
              admin: { disableListColumn: true }
            }
          ]
        }
      ]
    },
    slugField({ sourceField: 'name' })
  ]
};

export default categories;

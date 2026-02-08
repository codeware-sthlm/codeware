import type { CollectionConfig } from 'payload';

import {
  colorPickerField,
  iconPickerField,
  slugField
} from '@codeware/app-cms/ui/fields';
import { adminGroups } from '@codeware/app-cms/util/definitions';

import { userOrApiKeyAccess } from '../../security/user-or-api-key-access';

/**
 * Tags collection
 */
const tags: CollectionConfig = {
  slug: 'tags',
  admin: {
    group: adminGroups.content,
    defaultColumns: ['name', 'slug'],
    useAsTitle: 'name'
  },
  access: {
    read: userOrApiKeyAccess()
  },
  labels: {
    singular: { en: 'Tag', sv: 'Etikett' },
    plural: { en: 'Tags', sv: 'Etiketter' }
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      maxLength: 20,
      admin: {
        description: {
          en: 'The name of the tag.',
          sv: 'Namnet på etiketten.'
        }
      }
    },
    {
      name: 'brand',
      type: 'group',
      admin: {
        description: {
          en: 'Select an icon and color that represent the tag.',
          sv: 'Välj en ikon och färg som representerar etiketten.'
        },
        hideGutter: true
      },
      fields: [
        {
          type: 'row',
          fields: [
            iconPickerField({
              props: { hideLabel: true },
              override: {
                admin: {
                  width: '25%'
                }
              }
            }),
            colorPickerField({
              props: { hideLabel: true },
              override: {
                admin: {
                  width: '25%'
                }
              }
            })
          ]
        }
      ]
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Media',
          fields: [
            {
              name: 'relatedMedia',
              label: false,
              type: 'join',
              collection: 'media',
              on: 'tags',
              admin: { disableListColumn: true }
            }
          ]
        }
      ]
    },
    slugField({ sourceField: 'name', maxLength: 20 })
  ]
};

export default tags;

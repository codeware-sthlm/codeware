import { virtualComposeField } from '@codeware/app-cms/ui/fields';
import type { Block } from 'payload';

import { composeFilesHook } from './compose-files-field.hook';

/**
 * File area block to select which media collection files to show in the file area.
 */
export const fileAreaBlock: Block = {
  slug: 'file-area',
  interfaceName: 'FileAreaBlock',
  fields: [
    {
      name: 'tags',
      type: 'relationship',
      relationTo: 'tags',
      label: {
        en: 'Tags',
        sv: 'Etiketter'
      },
      hasMany: true,
      admin: {
        description: {
          en: 'Select tags that represent the files to show in the file area.',
          sv: 'Välj etiketter som representerar de filer som ska visas i filområdet.'
        }
      }
    },
    virtualComposeField({
      field: {
        name: 'files',
        type: 'array',
        fields: [
          {
            name: 'media',
            type: 'relationship',
            relationTo: 'media'
          }
        ]
      },
      value: composeFilesHook
    })
  ]
};

import type { Block } from 'payload';

/**
 * Reusable content block for selecting the reusable content to render
 */
export const reusableContentBlock: Block = {
  slug: 'reusable-content',
  interfaceName: 'ReusableContentBlock',
  fields: [
    {
      name: 'reusableContent',
      type: 'relationship',
      relationTo: 'reusable-content',
      required: true
    },
    {
      name: 'refId',
      type: 'text',
      label: {
        en: 'Reference',
        sv: 'Referens'
      },
      admin: {
        description: {
          en: 'Optional reference that can be used to identify this block with CSS or JavaScript.',
          sv: 'Valfri referens som kan användas för att identifiera blocket med CSS eller JavaScript.'
        }
      }
    }
  ]
};

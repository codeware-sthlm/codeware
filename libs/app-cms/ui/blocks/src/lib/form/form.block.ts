import type { Block } from 'payload';

/**
 * Form block for building a custom form.
 */
export const formBlock: Block = {
  slug: 'form',
  interfaceName: 'FormBlock',
  labels: {
    plural: 'Form Blocks',
    singular: 'Form Block'
  },
  fields: [
    {
      name: 'form',
      type: 'relationship',
      relationTo: 'forms',
      required: true
    },
    {
      name: 'enableIntro',
      type: 'checkbox',
      label: {
        en: 'Add an introduction to the form',
        sv: 'Lägg till en introduktion till formuläret'
      }
    },
    {
      name: 'introContent',
      type: 'richText',
      label: { en: 'Introduction', sv: 'Introduktion' },
      admin: {
        condition: (_, { enableIntro }) => Boolean(enableIntro)
      }
    }
  ]
};

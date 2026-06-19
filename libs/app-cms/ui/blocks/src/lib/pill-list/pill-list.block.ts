import { sectionHeaderFields } from '@codeware/app-cms/ui/fields';
import { enumName } from '@codeware/app-cms/util/db';
import type { Block } from 'payload';

/**
 * Pill list block — a header plus a list of labelled pills, each with an
 * optional link. Reusable for packages, tech stacks, tag strips, and more.
 *
 * The `surface` variant is the bounded flexibility lever: `dark` renders an
 * inverted band (reads as a full-width card), `light` keeps it on the content
 * surface.
 */
export const pillListBlock: Block = {
  slug: 'pill-list',
  interfaceName: 'PillListBlock',
  labels: {
    singular: { en: 'Pill list', sv: 'Etikettlista' },
    plural: { en: 'Pill list', sv: 'Etikettlista' }
  },
  fields: [
    ...sectionHeaderFields(),
    {
      name: 'surface',
      type: 'select',
      label: { en: 'Surface', sv: 'Yta' },
      enumName: enumName('pill_list_surface'),
      admin: {
        description: {
          en: 'Background treatment',
          sv: 'Bakgrund'
        }
      },
      options: [
        { label: { en: 'Dark', sv: 'Mörk' }, value: 'dark' },
        { label: { en: 'Light', sv: 'Ljus' }, value: 'light' }
      ],
      defaultValue: 'dark'
    },
    {
      name: 'items',
      type: 'array',
      minRows: 1,
      label: { en: 'Pills', sv: 'Etiketter' },
      labels: {
        singular: { en: 'Pill', sv: 'Etikett' },
        plural: { en: 'Pills', sv: 'Etiketter' }
      },
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'label',
          type: 'text',
          label: { en: 'Label', sv: 'Etikett' },
          admin: {
            description: {
              en: 'e.g. "my-package"',
              sv: 't.ex. "mitt-paket"'
            }
          },
          required: true
        },
        {
          name: 'url',
          type: 'text',
          label: { en: 'URL', sv: 'URL' },
          admin: {
            description: {
              en: 'Optional external link',
              sv: 'Valfri extern länk'
            }
          }
        }
      ]
    }
  ]
};

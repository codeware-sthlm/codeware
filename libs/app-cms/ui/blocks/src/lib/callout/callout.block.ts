import { linkGroupField } from '@codeware/app-cms/ui/fields';
import type { Block } from 'payload';

/**
 * Callout block — a compact, centered call-to-action band ("mini hero").
 *
 * An optional brand mark, a heading, a short body and a single action button.
 * The button label comes from the link group's label field.
 */
export const calloutBlock: Block = {
  slug: 'callout',
  interfaceName: 'CalloutBlock',
  labels: {
    singular: { en: 'Callout', sv: 'Callout' },
    plural: { en: 'Callout', sv: 'Callout' }
  },
  fields: [
    {
      name: 'showMark',
      type: 'checkbox',
      label: { en: 'Show brand mark', sv: 'Visa varumärke' },
      defaultValue: true
    },
    {
      name: 'heading',
      type: 'text',
      label: { en: 'Heading', sv: 'Rubrik' },
      localized: true,
      required: true
    },
    {
      name: 'body',
      type: 'textarea',
      label: { en: 'Body', sv: 'Text' },
      localized: true
    },
    linkGroupField({
      localizedLabel: true,
      overrides: { interfaceName: 'CalloutLink', label: false }
    })
  ]
};

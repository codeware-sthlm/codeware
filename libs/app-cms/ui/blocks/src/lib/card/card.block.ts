import { cardGroupField } from '@codeware/app-cms/ui/fields';
import type { Block } from 'payload';

/**
 * Card block that make it possible to select from a list of collection cards,
 * or to create custom cards for the document implementing this block.
 */
export const cardBlock: Block = {
  slug: 'card',
  interfaceName: 'CardBlock',
  fields: [
    {
      // TODO: Not needed, replaced by reusable-content
      name: 'collectionCards',
      type: 'relationship',
      relationTo: 'cards',
      hasMany: true,
      label: {
        en: 'Reusable cards',
        sv: 'Återanvändbara kort'
      },
      admin: {
        description: {
          en: 'Select the reusable cards to be displayed',
          sv: 'Välj vilka återanvändbara kort som ska visas'
        }
      }
    },
    {
      // TODO: Refactor names
      name: 'customCards',
      type: 'array',
      label: {
        en: 'Custom cards',
        sv: 'Valfria kort'
      },
      labels: {
        singular: {
          en: 'Card',
          sv: 'Kort'
        },
        plural: {
          en: 'Cards',
          sv: 'Kort'
        }
      },
      fields: [cardGroupField],
      admin: {
        description: {
          en: 'Complement with custom cards',
          sv: 'Komplettera med valfria kort'
        },
        components: {
          RowLabel:
            '@codeware/app-cms/ui/fields/card-group/CardGroupArrayRowLabel.client'
        },
        initCollapsed: true
      }
    }
  ]
};

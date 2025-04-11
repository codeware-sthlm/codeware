import type {
  CardGroup,
  CardGroupLink
} from '@codeware/shared/util/payload-types';
import type { Condition, GroupField, TypeWithID } from 'payload';

import { colorPickerField } from '../color-picker/color-picker.field';
import { iconPickerField } from '../icon-picker/icon-picker.field';
import { linkGroupField } from '../link-group/link-group.field';

const link = linkGroupField({
  disableLabel: true
});

const isLinkEnabled: Condition<TypeWithID, CardGroup> = (_, siblingData) =>
  siblingData?.enableLink === true;

const isNavTrigger =
  (
    trigger: CardGroupLink['navTrigger']
  ): Condition<TypeWithID, CardGroupLink> =>
  (_, siblingData) =>
    siblingData?.navTrigger === trigger;

export const cardGroupFieldName = 'card';

/**
 * Card group field that defines the card fields.
 *
 * It can be used as a group field or just the fields of the group.
 */
export const cardGroupField: GroupField = {
  name: cardGroupFieldName,
  type: 'group',
  interfaceName: 'CardGroup',
  label: false,
  admin: {
    hideGutter: true
  },
  fields: [
    {
      name: 'brand',
      type: 'group',
      admin: {
        description: {
          en: 'Select an icon and color that represent the card',
          sv: 'Välj en ikon och färg som representerar kortet'
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
      name: 'title',
      type: 'text',
      label: {
        en: 'Title',
        sv: 'Titel'
      },
      localized: true,
      required: true
    },
    {
      name: 'description',
      type: 'text',
      label: {
        en: 'Description',
        sv: 'Beskrivning'
      },
      admin: {
        description: {
          en: 'A text that will complement the title',
          sv: 'En text som ska komplettera titeln'
        }
      },
      localized: true
    },
    {
      name: 'content',
      type: 'textarea',
      label: {
        en: 'Main content',
        sv: 'Huvudinnehåll'
      },
      localized: true,
      required: true
    },
    {
      name: 'enableLink',
      type: 'checkbox',
      label: {
        en: 'Card link',
        sv: 'Länk på kortet'
      },
      admin: {
        description: {
          en: 'Let the card link to a page or external URL',
          sv: 'Låt kortet länka till en sida eller en extern URL'
        }
      }
    },
    {
      ...link,
      interfaceName: 'CardGroupLink',
      label: false,
      admin: {
        ...link.admin,
        condition: isLinkEnabled,
        disableListColumn: true,
        disableListFilter: true
      },
      fields: [
        ...link.fields,
        {
          name: 'navTrigger',
          type: 'radio',
          label: {
            en: 'Navigation trigger',
            sv: 'Navigering aktiveras'
          },
          admin: {
            layout: 'horizontal'
          },
          options: [
            {
              label: {
                en: 'Click on card',
                sv: 'Klicka på kortet'
              },
              value: 'card'
            },
            {
              label: {
                en: 'Click on link',
                sv: 'Klicka på en länk'
              },
              value: 'link'
            }
          ],
          defaultValue: 'card'
        },
        {
          name: 'label',
          type: 'text',
          label: {
            en: 'Link label',
            sv: 'Länk text'
          },
          admin: {
            condition: isNavTrigger('link')
          },
          localized: true,
          required: true
        }
      ]
    }
  ]
};

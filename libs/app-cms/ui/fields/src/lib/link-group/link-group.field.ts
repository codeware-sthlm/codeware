import { enumName } from '@codeware/app-cms/util/db';
import { deepMerge } from '@codeware/shared/util/pure';
import type { Field, GroupField } from 'payload';

type LinkType = (
  options?: {
    /**
     * Custom fields to be added to the group field.
     */
    customFields?: Array<Field>;
    /**
     * Override properties which will be deep merged with the group field.
     */
    overrides?: Partial<GroupField>;
  } & (
    | {
        /**
         * Whether to apply localization to the label field.
         *
         * @default true
         */
        localizedLabel: boolean;
      }
    | {
        /**
         * Whether to skip generating the label field.
         *
         * @default false
         */
        skipLabel?: true;
      }
  )
) => GroupField;

/**
 * Link group field that can be used to link to a document or a custom URL.
 *
 * @param options - Options for the field
 */
export const linkGroupField: LinkType = ({
  customFields,
  overrides,
  ...options
} = {}) => {
  const localizedLabel =
    'localizedLabel' in options && (options.localizedLabel ?? true);
  const skipLabel = 'skipLabel' in options && options.skipLabel;

  const linkGroup: GroupField = {
    name: 'link',
    type: 'group',
    admin: {
      hideGutter: true
    },
    fields: [
      {
        type: 'row',
        fields: [
          {
            name: 'type',
            type: 'radio',
            admin: {
              layout: 'horizontal',
              width: '50%'
            },
            defaultValue: 'reference',
            enumName: enumName('link_type'),
            options: [
              {
                label: {
                  en: 'Internal link',
                  sv: 'Intern länk'
                },
                value: 'reference'
              },
              {
                label: {
                  en: 'Custom URL',
                  sv: 'Anpassad URL'
                },
                value: 'custom'
              }
            ]
          },
          {
            name: 'newTab',
            type: 'checkbox',
            admin: {
              style: {
                alignSelf: 'flex-end'
              },
              width: '50%'
            },
            label: {
              en: 'Open in new tab',
              sv: 'Öppna i ny flik'
            }
          }
        ]
      }
    ]
  };

  // Link options share the row with the label when it's not disabled
  const linkOptions: Array<Field> = [
    {
      name: 'reference',
      type: 'relationship',
      admin: {
        condition: (_, siblingData) => siblingData?.type === 'reference',
        width: skipLabel ? undefined : '50%'
      },
      label: {
        en: 'Document to link to',
        sv: 'Dokument att länka till'
      },
      relationTo: ['pages', 'posts'],
      required: true
    },
    {
      name: 'url',
      type: 'text',
      admin: {
        description: {
          en: 'Add protocol (http:// or https://) if the link is external',
          sv: 'Lägg till protokoll (http:// eller https://) om länken är extern'
        },
        condition: (_, siblingData) => siblingData?.type === 'custom',
        width: skipLabel ? undefined : '50%'
      },
      label: {
        en: 'Custom URL',
        sv: 'Anpassad URL'
      },
      required: true
    }
  ];

  if (skipLabel) {
    linkGroup.fields.push(...linkOptions);
  } else {
    linkGroup.fields.push({
      type: 'row',
      fields: [
        ...linkOptions,
        {
          name: 'label',
          type: 'text',
          admin: {
            width: '50%'
          },
          label: 'Label',
          localized: localizedLabel,
          required: true
        }
      ]
    });
  }

  if (customFields) {
    linkGroup.fields.push(...customFields);
  }

  return overrides ? deepMerge(linkGroup, overrides) : linkGroup;
};

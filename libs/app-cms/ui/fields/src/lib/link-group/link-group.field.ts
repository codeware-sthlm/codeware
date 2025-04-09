import type { Field, GroupField } from 'payload';

type LinkType = (options?: {
  disableLabel?: boolean;
  overrides?: Partial<GroupField>;
}) => GroupField;

/**
 * Link group field that can be used to link to a document or a custom URL.
 *
 * @param options - Options for the link field
 */
export const linkGroupField: LinkType = ({ disableLabel = false } = {}) => {
  const linkResult: GroupField = {
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

  const linkTypes: Field[] = [
    {
      name: 'reference',
      type: 'relationship',
      admin: {
        condition: (_, siblingData) => siblingData?.type === 'reference'
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
        condition: (_, siblingData) => siblingData?.type === 'custom'
      },
      label: {
        en: 'Custom URL',
        sv: 'Anpassad URL'
      },
      required: true
    }
  ];

  if (disableLabel) {
    linkResult.fields = [...linkResult.fields, ...linkTypes];
    return linkResult;
  }

  linkTypes.map((linkType) => ({
    ...linkType,
    admin: {
      ...linkType.admin,
      width: '50%'
    }
  }));

  linkResult.fields.push({
    type: 'row',
    fields: [
      ...linkTypes,
      {
        name: 'label',
        type: 'text',
        admin: {
          width: '50%'
        },
        label: 'Label',
        required: true
      }
    ]
  });

  return linkResult;
};

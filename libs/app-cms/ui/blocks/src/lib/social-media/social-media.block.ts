import { enumName } from '@codeware/app-cms/util/db';
import { socialIconsMap } from '@codeware/shared/ui/react-universal-components';
import type {
  SocialMediaBlock,
  SocialMediaBlockSocial
} from '@codeware/shared/util/payload-types';
import { validateUrl } from '@payloadcms/richtext-lexical';
import type { Block, Condition, TypeWithID } from 'payload';

const socialMediaOptions = Object.entries(socialIconsMap).map(
  ([key, value]) => ({
    label: value.name,
    value: key
  })
);

// Whether the block has multiple social
const multipleIcons: Condition<TypeWithID, SocialMediaBlock> = (
  _,
  siblingData
) => !!siblingData.social && siblingData.social.length > 1;

// Whether the social media should have a label
const withLabel: Condition<TypeWithID, SocialMediaBlockSocial> = (
  _,
  siblingData
) => siblingData.withLabel === true;

/**
 * Social media block for rendering social media links.
 */
export const socialMediaBlock: Block = {
  slug: 'social-media',
  interfaceName: 'SocialMediaBlock',
  fields: [
    {
      name: 'social',
      type: 'array',
      label: { en: 'Social Media Links', sv: 'Länkar till sociala medier' },
      labels: {
        singular: { en: 'Social Media', sv: 'Social media' },
        plural: { en: 'Social Media', sv: 'Sociala medier' }
      },
      admin: {
        components: {
          RowLabel:
            '@codeware/app-cms/ui/blocks/social-media/SocialMediaBlockArrayRowLabel.client'
        },
        initCollapsed: true
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'platform',
              type: 'select',
              admin: {
                width: '50%'
              },
              label: { en: 'Platform', sv: 'Plattform' },
              enumName: enumName('social_media_platform'),
              options: socialMediaOptions,
              required: true
            },
            {
              name: 'url',
              type: 'text',
              label: 'URL',
              admin: {
                width: '50%'
              },
              validate: (value, { req: { i18n } }) => {
                const isValid = value && validateUrl(value);
                return isValid ? true : i18n.t('fields:enterURL');
              },
              hasMany: false,
              required: true
            }
          ]
        },
        {
          type: 'row',
          fields: [
            {
              name: 'withLabel',
              type: 'checkbox',
              label: { en: 'With label', sv: 'Med text' },
              admin: {
                width: '50%'
              }
            },
            {
              name: 'label',
              type: 'text',
              label: { en: 'Icon label', sv: 'Ikon text' },
              admin: {
                condition: withLabel,
                description: {
                  en: 'Short text to display next to the icon',
                  sv: 'Kort text som visas bredvid ikonen'
                },
                width: '50%'
              }
            }
          ]
        }
      ]
    },
    {
      name: 'direction',
      type: 'radio',
      label: { en: 'Direction', sv: 'Riktning' },
      admin: {
        layout: 'horizontal',
        description: {
          en: 'How the social media links are displayed',
          sv: 'Hur länkarna ska visas'
        },
        condition: multipleIcons
      },
      enumName: enumName('social_media_direction'),
      options: [
        {
          label: { en: 'Horizontal', sv: 'Horisontell' },
          value: 'horizontal'
        },
        {
          label: { en: 'Vertical', sv: 'Vertikal' },
          value: 'vertical'
        }
      ],
      defaultValue: 'horizontal'
    }
  ]
};

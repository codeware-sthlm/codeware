import { enumName } from '@codeware/app-cms/util/db';
import { type Platform, socialIconsMap } from '@codeware/shared/ui/primitives';
import type {
  SocialMediaBlock,
  SocialMediaBlockSocial
} from '@codeware/shared/util/payload-types';
import type { ExtractTypes } from '@codeware/shared/util/typesafe';
import { validateUrl } from '@payloadcms/richtext-lexical';
import type { Block, Condition, TypeWithID } from 'payload';

const socialMediaOptions = Object.entries(socialIconsMap).map(
  ([key, value]) => ({
    label: value.name,
    value: key
  })
);

// Condition to match a email, phone or url-specific platform
const matchPlatform = (
  platform: ExtractTypes<Platform, 'email' | 'phone'> | 'url'
): Condition<TypeWithID, SocialMediaBlockSocial> => {
  return (_, siblingData) =>
    platform === 'url'
      ? siblingData.platform !== 'email' && siblingData.platform !== 'phone'
      : siblingData.platform === platform;
};

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
 * Phone number pattern: allows digits, spaces, dashes, and parentheses
 * Optional + prefix for international numbers
 *
 * Examples:
 * - `+1-234-567-8900`
 * - `+46 70 123 45 67`
 * - `(123) 456-7890`
 */
const phonePattern = /^\+?[\d\s\-()]+$/;

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
              name: 'email',
              type: 'email',
              label: 'Email',
              admin: {
                width: '50%',
                condition: matchPlatform('email')
              },
              required: true
            },
            {
              name: 'phone',
              type: 'text',
              label: { en: 'Phone', sv: 'Telefon' },
              admin: {
                width: '50%',
                condition: matchPlatform('phone')
              },
              validate: (value) => {
                const stringValue =
                  typeof value === 'string'
                    ? value
                    : value != null
                      ? String(value)
                      : '';
                const digitCount = stringValue.replace(/\D/g, '').length;
                const hasMinLength = digitCount >= 7;
                const isValid =
                  !!stringValue &&
                  hasMinLength &&
                  !!stringValue.match(phonePattern);
                // TODO: Language support
                return isValid ? true : 'Please enter a valid phone number';
              },
              hasMany: false, // infer correct validate type
              required: true
            },
            {
              name: 'url',
              type: 'text',
              label: 'URL',
              admin: {
                width: '50%',
                condition: matchPlatform('url')
              },
              validate: (value, { req: { i18n } }) => {
                const isValid = value && validateUrl(value);
                return isValid ? true : i18n.t('fields:enterURL');
              },
              hasMany: false, // infer correct validate type
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

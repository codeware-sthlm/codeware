import { enumName } from '@codeware/app-cms/util/db';
import { customT } from '@codeware/app-cms/util/i18n';
import { type Platform, socialIconsMap } from '@codeware/shared/ui/primitives';
import { deepMerge } from '@codeware/shared/util/pure';
import type { ExtractTypes } from '@codeware/shared/util/typesafe';
import { validateUrl } from '@payloadcms/richtext-lexical';
import type { ArrayField, Condition, TypeWithID } from 'payload';

/**
 * Shape of a social link row, as it comes out of the editor.
 */
type SocialLinkRow = {
  platform?: Platform | null;
  withLabel?: boolean | null;
};

// Condition to match a email, phone or url-specific platform
const matchPlatform = (
  platform: ExtractTypes<Platform, 'email' | 'phone'> | 'url'
): Condition<TypeWithID, SocialLinkRow> => {
  return (_, siblingData) =>
    platform === 'url'
      ? siblingData.platform !== 'email' && siblingData.platform !== 'phone'
      : siblingData.platform === platform;
};

// Whether the social link should have a label
const withLabel: Condition<TypeWithID, SocialLinkRow> = (_, siblingData) =>
  siblingData.withLabel === true;

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

const socialLinkOptions = Object.entries(socialIconsMap).map(
  ([key, value]) => ({
    label: value.name,
    value: key
  })
);

type SocialLinksOptions = {
  /**
   * Field name of the array.
   */
  name: string;
  /**
   * Enum identifier for the platform select field.
   *
   * Must be unique per usage to avoid clashing enums in the database.
   */
  platformEnum: string;
  /**
   * Override properties which will be deep merged with the array field.
   */
  overrides?: Partial<ArrayField>;
};

/**
 * Array field for social links, where each row is a platform with an
 * email, phone number or URL, rendered with the platform icon.
 *
 * @param options - Options for the field
 */
export const socialLinksField = ({
  name,
  platformEnum,
  overrides
}: SocialLinksOptions): ArrayField => {
  const field: ArrayField = {
    name,
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
            enumName: enumName(platformEnum),
            options: socialLinkOptions,
            required: true
          },
          {
            name: 'email',
            type: 'email',
            label: { en: 'Email', sv: 'E-post' },
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
            validate: (value, { req: { t } }) => {
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

              return isValid ? true : customT(t)('validation:phoneNumber');
            },
            hasMany: false, // infer correct validate type
            required: true
          },
          {
            name: 'url',
            type: 'text',
            label: { en: 'URL', sv: 'URL' },
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
  };

  return overrides ? deepMerge(field, overrides) : field;
};

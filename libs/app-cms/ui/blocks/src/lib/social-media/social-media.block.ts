import { enumName } from '@codeware/app-cms/util/db';
import { socialIconsMap } from '@codeware/shared/ui/react-universal-components';
import { validateUrl } from '@payloadcms/richtext-lexical';
import type { Block } from 'payload';

const socialMediaOptions = Object.entries(socialIconsMap).map(
  ([key, value]) => ({
    label: value.name,
    value: key
  })
);

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
        }
      ]
    }
  ]
};

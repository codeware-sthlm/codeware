import {
  BlocksFeature,
  HeadingFeature,
  lexicalEditor
} from '@payloadcms/richtext-lexical';
import type { Block } from 'payload';

/**
 * Content block for defining a column layout with rich text content.
 */
export const contentBlock: Block = {
  slug: 'content',
  interfaceName: 'ContentBlock',
  fields: [
    {
      name: 'columns',
      type: 'array',
      admin: {
        initCollapsed: true
      },
      fields: [
        {
          name: 'size',
          type: 'select',
          defaultValue: 'full',
          options: [
            {
              label: { en: 'One Third', sv: 'En tredjedel' },
              value: 'one-third'
            },
            {
              label: { en: 'Half', sv: 'Hälften' },
              value: 'half'
            },
            {
              label: { en: 'Two Thirds', sv: 'Två tredjedelar' },
              value: 'two-thirds'
            },
            {
              label: { en: 'Full', sv: 'Hela' },
              value: 'full'
            }
          ]
        },
        {
          name: 'richText',
          type: 'richText',
          editor: lexicalEditor({
            features: ({ rootFeatures }) => {
              return [
                ...rootFeatures,
                BlocksFeature({ blocks: ['card', 'code', 'form', 'media'] }),
                HeadingFeature({
                  enabledHeadingSizes: ['h2', 'h3', 'h4', 'h5']
                })
              ];
            }
          }),
          label: false
        }
      ]
    }
  ]
};

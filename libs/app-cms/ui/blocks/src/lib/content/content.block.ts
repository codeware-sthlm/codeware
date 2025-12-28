import { multiTenantLinkFeature } from '@codeware/app-cms/ui/lexical';
import { enumName } from '@codeware/app-cms/util/db';
import type { BlockSlug } from '@codeware/shared/util/payload-types';
import { getActiveKeys } from '@codeware/shared/util/pure';
import { BlocksFeature, lexicalEditor } from '@payloadcms/richtext-lexical';
import type { Block } from 'payload';

/**
 * Define which blocks are available as rich text plugins.
 */
// Using a record to make sure all blocks are included and not forgotten
const richTextBlocks: Record<BlockSlug, boolean> = {
  card: true,
  code: true,
  form: true,
  image: true,
  media: true,
  'social-media': true,
  spacing: true,
  // Unsupported blocks
  content: false,
  'file-area': false,
  'reusable-content': false,
  video: false
};

/** Define which blocks are available within the content block itself. */
const inlineBlocks: Record<BlockSlug, boolean> = {
  card: true,
  form: true,
  image: true,
  media: true,
  code: true,
  'reusable-content': true,
  'social-media': true,
  spacing: true,
  // Unsupported blocks
  content: false,
  'file-area': false,
  video: false
};

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
          enumName: enumName('content_column_size'),
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
                BlocksFeature({
                  blocks: getActiveKeys<BlockSlug>(richTextBlocks)
                }),
                multiTenantLinkFeature()
              ];
            }
          }),
          label: false
        },
        {
          name: 'blocks',
          type: 'blocks',
          blockReferences: getActiveKeys<BlockSlug>(inlineBlocks),
          blocks: [],
          label: false
        }
      ]
    }
  ]
};

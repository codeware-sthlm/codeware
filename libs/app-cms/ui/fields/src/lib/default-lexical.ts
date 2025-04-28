import {
  FixedToolbarFeature,
  HeadingFeature,
  lexicalEditor
} from '@payloadcms/richtext-lexical';
import type { Config } from 'payload';

/**
 * Default lexical editor configuration setup.
 *
 * Payload features
 * @see https://payloadcms.com/docs/rich-text/overview#features-overview
 */
export const defaultLexical: Config['editor'] = lexicalEditor({
  features: ({ defaultFeatures }) => [
    ...defaultFeatures.filter(({ key }) => {
      // Disabled default features
      switch (key) {
        case 'link': // Custom link feature (with multi-tenant support) must be added on field level.
        case 'relationship': // Feature seems flaky. Use inline link instead until we have a strong use case.
        case 'upload': // Doesn't add much (or anything) compared to the media block.
          return false;
      }
      return true;
    }),
    FixedToolbarFeature({ applyToFocusedEditor: true }),
    HeadingFeature({
      enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4', 'h5']
    })
  ]
});

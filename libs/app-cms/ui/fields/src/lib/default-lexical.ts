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
    ...defaultFeatures.filter(
      (feature) =>
        // Exclude default features which we don't support yet
        !['relationship', 'upload'].includes(feature.key)
    ),
    FixedToolbarFeature({ applyToFocusedEditor: true }),
    HeadingFeature({
      enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4', 'h5']
    })
  ]
});

import { createHeadlessEditor } from '@lexical/headless';
import { $convertFromMarkdownString } from '@lexical/markdown';
import {
  defaultEditorFeatures,
  getEnabledNodes,
  sanitizeServerEditorConfig
} from '@payloadcms/richtext-lexical';
import type { SanitizedConfig } from 'payload';

/**
 * Convert a markdown string to lexical state.
 *
 * This JSON object can be rendered using the LexicalRenderer component
 * or saved to a Payload collection editor field.
 *
 * @param markdown - The markdown string to convert.
 * @returns The lexical JSON object or undefined if markdown is not provided.
 */
export const convertMarkdownToLexical = async (
  config: SanitizedConfig,
  markdown?: string
) => {
  if (!markdown) {
    return undefined;
  }

  const editorConfig = await sanitizeServerEditorConfig(
    {
      // TODO: Should be the features applied in `payload.config.ts`
      features: defaultEditorFeatures
    },
    config
  );
  const headlessEditor = createHeadlessEditor({
    nodes: getEnabledNodes({ editorConfig })
  });

  headlessEditor.update(
    () => {
      $convertFromMarkdownString(
        markdown,
        editorConfig.features.markdownTransformers
      );
    },
    { discrete: true }
  );

  const json = headlessEditor.getEditorState().toJSON();
  if (!json) {
    console.warn(`Failed to convert markdown to lexical:\n${markdown}`);
  }

  // Need to append unknown record to satisfy Payload generated Lexical types
  return json as typeof json & Record<string, unknown>;
};

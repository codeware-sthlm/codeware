import {
  $convertFromMarkdownString,
  defaultEditorFeatures,
  getEnabledNodes,
  sanitizeServerEditorConfig
} from '@payloadcms/richtext-lexical';
import type {
  SerializedEditorState,
  SerializedLexicalNode
} from '@payloadcms/richtext-lexical/lexical';
import { createHeadlessEditor } from '@payloadcms/richtext-lexical/lexical/headless';
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
): Promise<
  SerializedEditorState<SerializedLexicalNode> & Record<string, unknown>
> => {
  if (!markdown) {
    return {
      root: {
        children: [],
        type: 'root',
        version: 1,
        direction: 'ltr',
        format: 'left',
        indent: 0
      }
    };
  }

  const editorConfig = await sanitizeServerEditorConfig(
    {
      // Might not be exactly the same as being used by the app,
      // but it's meant for seeding data and not for rendering in the UI
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

import { createHeadlessEditor } from '@lexical/headless';
import { $convertFromMarkdownString } from '@lexical/markdown';
import {
  defaultEditorFeatures,
  getEnabledNodes,
  sanitizeEditorConfig
} from '@payloadcms/richtext-lexical';
import type { SerializedEditorState } from 'lexical';

// Need to append unknown record to satisfy Payload generated Lexical types
type LexicalJson = SerializedEditorState & Record<string, unknown>;

/**
 * Convert a markdown string to lexical state.
 *
 * This JSON object can be rendered using the LexicalRenderer component
 * or saved to a Payload collection editor field.
 *
 * @param markdown - The markdown string to convert.
 * @returns The lexical JSON object or undefined if markdown is not provided.
 */
export const convertMarkdownToLexical = (
  markdown?: string
): LexicalJson | undefined => {
  if (!markdown) {
    return undefined;
  }

  const editorConfig = sanitizeEditorConfig({
    features: defaultEditorFeatures
  });
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

  const json = headlessEditor.getEditorState().toJSON() as LexicalJson;
  if (!json) {
    console.warn(`Failed to convert markdown to lexical:\n${markdown}`);
  }

  return json;
};

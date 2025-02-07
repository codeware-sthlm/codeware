import React from 'react';

import { renderNode } from './render-node';
import type { EditorState, NodeType } from './types';

/**
 * Convert Lexical content to a React element.
 *
 * @param content - The Lexical content to convert.
 * @returns The React element for the content.
 */
export const LexicalRenderer = ({
  content
}: {
  content: EditorState<string> | null;
}) => {
  if (!content?.root) return null;

  // Properly typed since content `type` is just a string
  const typedContent = content as EditorState<NodeType>;

  return (
    <div dir={typedContent.root.direction || 'ltr'}>
      {typedContent.root.children?.map((node, index) => (
        <React.Fragment key={index}>{renderNode(node)}</React.Fragment>
      ))}
    </div>
  );
};

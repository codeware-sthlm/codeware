import type { Post } from '@codeware/shared/util/payload-types';

/**
 * Minimal structural type covering both text nodes (have `text`) and
 * element nodes (have `children`) in a Lexical serialized editor state.
 */
type LexicalNode = {
  text?: string;
  children?: Array<LexicalNode>;
};

function extractText(node: LexicalNode): string {
  if (typeof node.text === 'string') {
    return node.text;
  }
  return Array.isArray(node.children)
    ? node.children.map(extractText).join(' ')
    : '';
}

/**
 * Extract a plain text excerpt from a post's Lexical rich text content.
 *
 * @param post - The post to extract the excerpt from
 * @param maxLength - Maximum character length before truncation (default 200)
 * @returns Plain text excerpt, truncated at a word boundary if needed
 */
export function getExcerpt(post: Post, maxLength = 200): string {
  try {
    const content = post.content;
    if (!content?.root?.children) {
      return '';
    }

    const fullText = (content.root.children as Array<LexicalNode>)
      .map(extractText)
      .join(' ')
      .trim();

    if (fullText.length <= maxLength) {
      return fullText;
    }

    const truncated = fullText.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    return lastSpace > 0
      ? truncated.substring(0, lastSpace) + '...'
      : truncated + '...';
  } catch {
    return '';
  }
}

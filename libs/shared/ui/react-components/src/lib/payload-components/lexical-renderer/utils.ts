import type { ElementFormatType } from 'lexical';

import type {
  BlockCodeNode,
  HeadingNode,
  LexicalNode,
  LinkNode,
  ListItemNode,
  ListNode,
  ParagraphNode,
  QuoteNode,
  TextNode
} from './types';

export const getAlignmentClass = (format: ElementFormatType): string => {
  switch (format) {
    case 'left':
    case 'start': {
      return 'text-left';
    }
    case 'center': {
      return 'text-center';
    }
    case 'right':
    case 'end': {
      return 'text-right';
    }
    case 'justify': {
      return 'text-justify';
    }
    default: {
      return '';
    }
  }
};

export const isBlockCodeNode = (node: LexicalNode): node is BlockCodeNode =>
  node.type === 'block' &&
  'fields' in node &&
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (node.fields as any).blockType === 'code';

export const isHeadingNode = (node: LexicalNode): node is HeadingNode =>
  node.type === 'heading' && 'tag' in node;

export const isLinkNode = (node: LexicalNode): node is LinkNode =>
  node.type === 'link' && 'fields' in node;

export const isListItemNode = (node: LexicalNode): node is ListItemNode =>
  node.type === 'listitem' && 'children' in node;

export const isListNode = (node: LexicalNode): node is ListNode =>
  node.type === 'list' && 'listType' in node;

export const isParagraphNode = (node: LexicalNode): node is ParagraphNode =>
  node.type === 'paragraph' && 'format' in node;

export const isQuoteNode = (node: LexicalNode): node is QuoteNode =>
  node.type === 'quote' && 'format' in node;

export const isTextNode = (node: LexicalNode): node is TextNode =>
  node.type === 'text' && 'text' in node && 'format' in node;

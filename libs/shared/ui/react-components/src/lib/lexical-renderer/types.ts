import type { Prettify } from '@codeware/shared/util/typesafe';
import type {
  SerializedEditorState,
  SerializedElementNode,
  SerializedLexicalNode,
  SerializedTextNode
} from 'lexical';

import type { Language } from '../code';

export type NodeType =
  | 'block'
  | 'heading'
  | 'link'
  | 'list'
  | 'listitem'
  | 'paragraph'
  | 'quote'
  | 'text';

/**
 * `type` typed version of `SerializedLexicalNode`
 */
export type LexicalNode<TNodeType extends NodeType | string = NodeType> =
  Prettify<
    SerializedLexicalNode & {
      type: TNodeType;
    }
  >;

/**
 * `type` typed version of `SerializedElementNode` and `SerializedTextNode`
 * @internal
 */
type ElementNode<TNodeType extends NodeType = NodeType> =
  (TNodeType extends 'text'
    ? SerializedTextNode
    : SerializedElementNode<LexicalNode<TNodeType>>) &
    LexicalNode<TNodeType>;

/**
 * External exposed `SerializedEditorState` with `type` string support
 */
export type EditorState<TNodeType extends NodeType | string = NodeType> =
  Prettify<SerializedEditorState<LexicalNode<TNodeType>>>;

export type BlockCodeNode = Prettify<
  ElementNode<'block'> & {
    fields: {
      blockType: 'code';
      id: string;
      code: string;
      language: Language;
      blockName: string;
    };
  }
>;

export type HeadingNode = Prettify<
  ElementNode<'heading'> & {
    tag: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  }
>;

export type LinkNode = Prettify<
  ElementNode<'link'> & {
    fields: {
      linkType: 'custom' | 'internal';
      url: string;
      newTab: boolean;
      doc: null;
    };
  }
>;

export type ListItemNode = ElementNode<'listitem'>;

export type ListNode = Prettify<
  ElementNode<'list'> & {
    listType: 'number' | 'bullet';
  }
>;

export type ParagraphNode = ElementNode<'paragraph'>;

export type QuoteNode = Prettify<ElementNode<'quote'>>;

export type TextNode = ElementNode<'text'>;

import React from 'react';

import { Code } from '../code';

import type { LexicalNode } from './types';
import {
  getAlignmentClass,
  isBlockCodeNode,
  isHeadingNode,
  isLinkNode,
  isListItemNode,
  isListNode,
  isParagraphNode,
  isQuoteNode,
  isTextNode
} from './utils';

/**
 * Render React template code for each supported Lexical node type.
 *
 * @param node - The Lexical node to render.
 * @returns The React template code for the node.
 */
export const renderNode = (node: LexicalNode): React.ReactNode => {
  switch (node.type) {
    case 'block': {
      if (!isBlockCodeNode(node)) return null;
      return <Code code={node.fields.code} language={node.fields.language} />;
    }

    case 'heading': {
      if (!isHeadingNode(node)) return null;
      return (
        <node.tag className={getAlignmentClass(node.format)}>
          {node.children?.map((child, index) => (
            <React.Fragment key={index}>{renderNode(child)}</React.Fragment>
          ))}
        </node.tag>
      );
    }

    case 'link': {
      if (!isLinkNode(node)) return null;
      return (
        <a
          href={node.fields.url}
          target={node.fields.newTab ? '_blank' : undefined}
          rel={node.fields.newTab ? 'noopener noreferrer' : undefined}
        >
          {node.children?.map((child, index) => (
            <React.Fragment key={index}>{renderNode(child)}</React.Fragment>
          ))}
        </a>
      );
    }

    case 'list': {
      if (!isListNode(node)) return null;
      const ListTag = node.listType === 'number' ? 'ol' : 'ul';
      return (
        <ListTag>
          {node.children?.map((child, index) => (
            <React.Fragment key={index}>{renderNode(child)}</React.Fragment>
          ))}
        </ListTag>
      );
    }

    case 'listitem': {
      if (!isListItemNode(node)) return null;
      return (
        <li>
          {node.children?.map((child, index) => (
            <React.Fragment key={index}>{renderNode(child)}</React.Fragment>
          ))}
        </li>
      );
    }

    case 'paragraph': {
      if (!isParagraphNode(node)) return null;
      return (
        <p
          className={getAlignmentClass(node.format)}
          style={{ marginLeft: `${node.indent * 20 || 0}px` }}
        >
          {node.children?.map((child, index) => (
            <React.Fragment key={index}>{renderNode(child)}</React.Fragment>
          ))}
        </p>
      );
    }

    case 'quote': {
      if (!isQuoteNode(node)) return null;
      return (
        <blockquote
          className={getAlignmentClass(node.format)}
          style={{ marginLeft: `${node.indent * 20 || 0}px` }}
        >
          {node.children?.map((child, index) => (
            <React.Fragment key={index}>{renderNode(child)}</React.Fragment>
          ))}
        </blockquote>
      );
    }

    case 'text': {
      if (!isTextNode(node)) return null;
      let content: React.ReactNode = node.text;
      if (node.format & 1) content = <strong>{content}</strong>;
      if (node.format & 2) content = <em>{content}</em>;
      if (node.format & 4) content = <u>{content}</u>;
      if (node.format & 8) content = <code>{content}</code>;
      if (node.format & 16) content = <code>{content}</code>;
      return content;
    }

    default: {
      return null;
    }
  }
};

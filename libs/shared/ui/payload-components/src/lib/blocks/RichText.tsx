import type {
  CardBlock as CardBlockProps,
  CodeBlock as CodeBlockProps,
  CollectionSlug,
  FormBlock as FormBlockProps,
  MediaBlock as MediaBlockProps,
  SocialMediaBlock as SocialMediaBlockProps
} from '@codeware/shared/util/payload-types';
import { cn } from '@codeware/shared/util/ui';
import type {
  DefaultNodeTypes,
  SerializedBlockNode,
  SerializedLinkNode
} from '@payloadcms/richtext-lexical';
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';
import {
  JSXConvertersFunction,
  LinkJSXConverter,
  RichText as RichTextWithoutBlocks
} from '@payloadcms/richtext-lexical/react';

import { CardBlock } from './CardBlock';
import { CodeBlock } from './CodeBlock';
import { FormBlock } from './FormBlock';
import { MediaBlock } from './MediaBlock';
import { SocialMediaBlock } from './SocialMediaBlock';

type NodeTypes =
  | DefaultNodeTypes
  | SerializedBlockNode<
      | CardBlockProps
      | CodeBlockProps
      | FormBlockProps
      | MediaBlockProps
      | SocialMediaBlockProps
    >;

/**
 * Map internal document links to collection url paths.
 * @see https://payloadcms.com/docs/rich-text/converting-jsx#converting-internal-links
 */
const internalDocToHref = ({ linkNode }: { linkNode: SerializedLinkNode }) => {
  const { relationTo, value } = linkNode.fields.doc ?? {};
  if (!value || typeof value !== 'object') {
    throw new Error('Expected link value to be an object');
  }

  if (!('slug' in value)) {
    throw new Error('Expected link value to have a slug property');
  }

  const slug = value.slug;

  switch (relationTo as CollectionSlug) {
    case 'pages':
      return `/${slug}`;
    default:
      return `/${relationTo}/${slug}`;
  }
};

/**
 * Converts custom Payload blocks from Lexical to React JSX components.
 *
 * Blocks defined in `app-cms-ui-blocks` must be added here to be rendered in a client.
 */
const jsxConverters: JSXConvertersFunction<NodeTypes> = ({
  defaultConverters
}) => ({
  ...defaultConverters,
  ...LinkJSXConverter({ internalDocToHref }),
  blocks: {
    card: ({ node }) => <CardBlock {...node.fields} />,
    code: ({ node }) => <CodeBlock {...node.fields} />,
    form: ({ node }) => <FormBlock {...node.fields} />,
    media: ({ node }) => <MediaBlock {...node.fields} />,
    'social-media': ({ node }) => <SocialMediaBlock {...node.fields} />
  }
});

type Props = {
  data: SerializedEditorState;
} & React.HTMLAttributes<HTMLDivElement> & { disableProse?: boolean };

/**
 * Rich text component to render Payload Lexical editor data.
 *
 * Since most data to this component is CMS generated,
 * prose is enabled by default to create a formatted and unified look.
 *
 * Use the `disableProse` property for situations where the content is
 * user generated and should be formatted manually.
 */
export const RichText = (props: Props) => {
  const { className = '', disableProse = false, ...rest } = props;

  return (
    <RichTextWithoutBlocks
      converters={jsxConverters}
      className={cn(
        {
          'prose md:prose-md dark:prose-invert mx-auto': !disableProse,
          'not-prose': disableProse
        },
        className
      )}
      {...rest}
    />
  );
};

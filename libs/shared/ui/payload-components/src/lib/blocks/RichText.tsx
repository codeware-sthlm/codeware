import type {
  CardBlock as CardBlockProps,
  CodeBlock as CodeBlockProps,
  FormBlock as FormBlockProps,
  MediaBlock as MediaBlockProps
} from '@codeware/shared/util/payload-types';
import { cn } from '@codeware/shared/util/ui';
import type {
  DefaultNodeTypes,
  SerializedBlockNode
} from '@payloadcms/richtext-lexical';
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';
import {
  JSXConvertersFunction,
  RichText as RichTextWithoutBlocks
} from '@payloadcms/richtext-lexical/react';

import { CardBlock } from './CardBlock';
import { CodeBlock } from './CodeBlock';
import { FormBlock } from './FormBlock';
import { MediaBlock } from './MediaBlock';

type NodeTypes =
  | DefaultNodeTypes
  | SerializedBlockNode<
      CardBlockProps | CodeBlockProps | FormBlockProps | MediaBlockProps
    >;

/**
 * Converts custom Payload blocks from Lexical to React JSX components.
 *
 * Blocks defined in `app-cms-ui-blocks` must be added here to be rendered in a client.
 */
const jsxConverters: JSXConvertersFunction<NodeTypes> = ({
  defaultConverters
}) => ({
  ...defaultConverters,
  blocks: {
    card: ({ node }) => <CardBlock {...node.fields} />,
    code: ({ node }) => <CodeBlock {...node.fields} />,
    form: ({ node }) => <FormBlock {...node.fields} />,
    media: ({ node }) => <MediaBlock {...node.fields} />
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

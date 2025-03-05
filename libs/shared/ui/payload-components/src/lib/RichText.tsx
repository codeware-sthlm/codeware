import type {
  CodeBlock as CodeBlockProps,
  MediaBlock as MediaBlockProps
} from '@codeware/shared/util/payload-types';
import type {
  DefaultNodeTypes,
  SerializedBlockNode
} from '@payloadcms/richtext-lexical';
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';
import {
  JSXConvertersFunction,
  RichText as RichTextWithoutBlocks
} from '@payloadcms/richtext-lexical/react';
import { clsx } from 'clsx';

import { CodeBlock } from './CodeBlock';
import { MediaBlock } from './MediaBlock';
import type { RenderBlocksExtraProps } from './render-blocks.type';

type NodeTypes =
  | DefaultNodeTypes
  | SerializedBlockNode<CodeBlockProps | MediaBlockProps>;

/**
 * Converts custom Payload blocks from Lexical to React JSX components.
 *
 * Blocks defined in `app-cms-ui-blocks` must be added here to be rendered in a client.
 */
const jsxConverters =
  (args: {
    apiUrl: string;
    enableProse: boolean;
    isDark: boolean;
  }): JSXConvertersFunction<NodeTypes> =>
  ({ defaultConverters }) => ({
    ...defaultConverters,
    blocks: {
      code: ({ node }) => <CodeBlock isDark={args.isDark} {...node.fields} />,
      media: ({ node }) => (
        <MediaBlock
          apiUrl={args.apiUrl}
          enableProse={args.enableProse}
          isDark={args.isDark}
          {...node.fields}
        />
      )
    }
  });

type Props = {
  data: SerializedEditorState;
} & Pick<RenderBlocksExtraProps, 'enableProse' | 'apiUrl' | 'isDark'> &
  React.HTMLAttributes<HTMLDivElement>;

/**
 * Rich text component to render Payload Lexical editor data.
 */
export const RichText = (props: Props) => {
  const { className = '', enableProse, apiUrl, isDark, ...rest } = props;
  return (
    <RichTextWithoutBlocks
      converters={jsxConverters({ apiUrl, enableProse, isDark })}
      className={clsx(
        {
          'mx-auto prose md:prose-md dark:prose-invert': enableProse
        },
        className
      )}
      {...rest}
    />
  );
};

export default RichText;

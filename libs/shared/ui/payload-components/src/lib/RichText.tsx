import {
  Code,
  type Props as CodeProps
} from '@codeware/shared/ui/react-components';
import type { CodeBlock } from '@codeware/shared/util/payload-types';
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

type NodeTypes =
  | DefaultNodeTypes
  | SerializedBlockNode<CodeProps & Pick<CodeBlock, 'blockType'>>;

/**
 * Converts custom Payload blocks from Lexical to React JSX components.
 *
 * Blocks defined in `app-cms-ui-blocks` must be added here to be rendered in a client.
 */
const jsxConverters =
  (isDark?: boolean): JSXConvertersFunction<NodeTypes> =>
  ({ defaultConverters }) => ({
    ...defaultConverters,
    blocks: {
      code: ({ node }) => (
        <Code theme={isDark ? 'vsDark' : 'vsLight'} {...node.fields} />
      )
    }
  });

type Props = {
  data: SerializedEditorState;
  enableGutter?: boolean;
  enableProse?: boolean;
  isDark: boolean;
} & React.HTMLAttributes<HTMLDivElement>;

/**
 * Rich text React component for Payload Lexical editor data.
 */
export const RichText = (props: Props) => {
  const {
    className,
    enableProse = true,
    enableGutter = true,
    isDark,
    ...rest
  } = props;
  return (
    <RichTextWithoutBlocks
      converters={jsxConverters(isDark)}
      className={clsx(
        {
          // TODO: Does this work for us; might be adapted to Payload Next.js template?
          'container ': enableGutter,
          'max-w-none': !enableGutter,
          'mx-auto prose md:prose-md dark:prose-invert ': enableProse
        },
        className
      )}
      {...rest}
    />
  );
};

export default RichText;

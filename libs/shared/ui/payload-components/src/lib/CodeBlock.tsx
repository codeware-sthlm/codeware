import { Code } from '@codeware/shared/ui/react-components';
import type { CodeBlock as CodeBlockProps } from '@codeware/shared/util/payload-types';

import type { RenderBlocksExtraProps } from './render-blocks.type';

type Props = CodeBlockProps & Pick<RenderBlocksExtraProps, 'isDark'>;

export const CodeBlock: React.FC<Props> = (props) => {
  const { code, isDark, language } = props;

  return (
    <Code
      code={code}
      language={language}
      theme={isDark ? 'vsDark' : 'vsLight'}
    />
  );
};

export default CodeBlock;

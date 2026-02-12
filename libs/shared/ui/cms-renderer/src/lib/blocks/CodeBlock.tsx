import { Code } from '@codeware/shared/ui/code';
import type { CodeBlock as CodeBlockProps } from '@codeware/shared/util/payload-types';

import { usePayload } from '../providers/PayloadProvider';

type Props = CodeBlockProps;

export const CodeBlock: React.FC<Props> = (props) => {
  const { code, language } = props;
  const { resolvedTheme } = usePayload();

  return (
    <Code
      code={code}
      language={language}
      theme={resolvedTheme === 'dark' ? 'vsDark' : 'vsLight'}
    />
  );
};

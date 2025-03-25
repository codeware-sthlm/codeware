import { Code } from '@codeware/shared/ui/react-components';
import type { CodeBlock as CodeBlockProps } from '@codeware/shared/util/payload-types';

import { usePayload } from '../providers/PayloadProvider';

type Props = CodeBlockProps;

export const CodeBlock: React.FC<Props> = (props) => {
  const { code, language } = props;
  const { theme } = usePayload();

  return (
    <Code
      code={code}
      language={language}
      theme={theme === 'dark' ? 'vsDark' : 'vsLight'}
    />
  );
};

import { Highlight, themes } from 'prism-react-renderer';
import React from 'react';

import CopyButton from './CopyButton';

export type Props = {
  code: string;
  language?: string;
  className?: string;
  theme?: keyof typeof themes;
};

/**
 * React code component for highlighting code blocks.
 *
 * Theme defaults to `vsLight`.
 *
 * @param props - The component props.
 * @returns A React component that renders a code block with syntax highlighting.
 */
export const Code: React.FC<Props> = ({
  code,
  language = '',
  className = '',
  theme = 'vsLight'
}) => {
  if (!code) return null;

  return (
    <div className={`relative ${className}`}>
      <Highlight code={code} language={language} theme={themes[theme]}>
        {({ className, getLineProps, getTokenProps, style, tokens }) => (
          <pre
            className={`${className} p-4 overflow-x-auto rounded-lg text-xs border border-slate-100 dark:border-slate-800`}
            style={style}
          >
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ className: 'table-row', line })}>
                <span className="table-cell select-none text-right text-slate-400 dark:text-slate-500">
                  {i + 1}
                </span>
                <span className="table-cell pl-4">
                  {line.map((token, key) => (
                    <span key={key} {...getTokenProps({ token })} />
                  ))}
                </span>
              </div>
            ))}
          </pre>
        )}
      </Highlight>
      <CopyButton code={code} />
    </div>
  );
};

export default Code;

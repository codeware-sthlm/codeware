import { Highlight, themes } from 'prism-react-renderer';
import React from 'react';

/**
 * Supported languages for code highlighting.
 */
export type Language =
  | 'css'
  | 'go'
  | 'graphql'
  | 'javascript'
  | 'json'
  | 'markup'
  | 'python'
  | 'sql'
  | 'tsx'
  | 'typescript'
  | 'yaml';

type Props = {
  code: string;
  language?: Language;
};

/**
 * React code component for highlighting code blocks.
 *
 * @param props - The component props.
 * @returns A React component that renders a code block with syntax highlighting.
 */
export const Code: React.FC<Props> = ({ code, language = '' }) => {
  if (!code) return null;

  return (
    <Highlight code={code} language={language} theme={themes.vsDark}>
      {({ getLineProps, getTokenProps, tokens }) => (
        <pre className="bg-black p-4 border text-xs border-border rounded overflow-x-auto">
          {tokens.map((line, i) => (
            <div key={i} {...getLineProps({ className: 'table-row', line })}>
              <span className="table-cell select-none text-right text-white/25">
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
  );
};

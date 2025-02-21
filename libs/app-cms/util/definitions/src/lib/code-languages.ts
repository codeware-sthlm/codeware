/**
 * List of languages supported by the code field.
 */
export const codeLanguages = {
  ts: 'TypeScript',
  plaintext: 'Plain Text',
  tsx: 'TSX',
  js: 'JavaScript',
  jsx: 'JSX'
} as const;

/**
 * List of languages supported by the Monaco editor.
 *
 * @see https://github.com/microsoft/monaco-editor/tree/main/src/basic-languages
 */
export const monacoLanguages = [
  'javascript',
  'plaintext',
  'typescript'
] as const;

/**
 * Map of code languages to their corresponding Monaco language.
 */
export const languageMap: Record<CodeLanguage, MonacoLanguage> = {
  plaintext: 'plaintext',
  ts: 'typescript',
  tsx: 'typescript',
  js: 'javascript',
  jsx: 'javascript'
};

/**
 * Code language.
 */
export type CodeLanguage = keyof typeof codeLanguages;

/**
 * Monaco code editor language.
 */
export type MonacoLanguage = (typeof monacoLanguages)[number];

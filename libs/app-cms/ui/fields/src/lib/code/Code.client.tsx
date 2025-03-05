'use client';

import {
  type CodeLanguage,
  codeLanguages,
  languageMap
} from '@codeware/app-cms/util/definitions';
import { CodeField, useFormFields } from '@payloadcms/ui';
import type { CodeFieldClient, CodeFieldClientProps } from 'payload';
import React, { useMemo } from 'react';

/**
 * Code field component for client-side rendering.
 *
 * Reads the current code language from the `language` field and converts it
 * to the corresponding Monaco language before rendering the code field.
 *
 * Defaults to `ts` if no code language is selected or the field is not defined.
 */
const Code: React.FC<CodeFieldClientProps> = ({
  autoComplete,
  field,
  forceRender,
  path,
  permissions,
  readOnly,
  renderedBlocks,
  schemaPath,
  validate
}) => {
  const languageField = useFormFields(([fields]) => fields['language']);

  // Get the selected code language from the language field or default to 'ts'
  const selectedCodeLanguage = (languageField?.value ||
    languageField?.initialValue ||
    ('ts' satisfies CodeLanguage)) as CodeLanguage;

  // Get the corresponding Monaco language
  const monacoLanguage = languageMap[selectedCodeLanguage];

  // Get the label for the code field or use the selected code language name
  const label = field.label ?? codeLanguages[selectedCodeLanguage].toString();

  const props: CodeFieldClient = useMemo<CodeFieldClient>(
    () => ({
      ...field,
      type: 'code',
      label,
      admin: {
        ...field.admin,
        editorOptions: field.admin?.editorOptions,
        language: monacoLanguage
      }
    }),
    [field, label, monacoLanguage]
  );

  const key = `${field.name}-${monacoLanguage}-${label}`;

  return (
    <CodeField
      autoComplete={autoComplete}
      field={props}
      forceRender={forceRender}
      key={key}
      path={path}
      permissions={permissions}
      readOnly={readOnly}
      renderedBlocks={renderedBlocks}
      schemaPath={schemaPath}
      validate={validate}
    />
  );
};

export default Code;

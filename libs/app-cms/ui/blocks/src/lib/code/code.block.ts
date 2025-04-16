import { codeField } from '@codeware/app-cms/ui/fields';
import { enumName } from '@codeware/app-cms/util/db';
import {
  type CodeLanguage,
  codeLanguages
} from '@codeware/app-cms/util/definitions';
import type { Block } from 'payload';

/**
 * Code block for editing code with a language selector
 */
export const codeBlock: Block = {
  slug: 'code',
  interfaceName: 'CodeBlock',
  fields: [
    {
      type: 'select',
      name: 'language',
      enumName: enumName('code_language'),
      options: Object.entries(codeLanguages).map(([key, value]) => ({
        label: value,
        value: key
      })),
      required: true,
      defaultValue: 'ts' satisfies CodeLanguage
    },
    codeField
  ]
};

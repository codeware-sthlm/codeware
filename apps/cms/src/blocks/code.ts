import type { Language } from '@codeware/shared/ui/react-components';
import type { Block } from 'payload/types';

export const Code: Block = {
  slug: 'code',
  interfaceName: 'CodeBlock',
  fields: [
    {
      name: 'language',
      type: 'select',
      defaultValue: 'typescript',
      options: [
        {
          label: 'TypeScript',
          value: 'typescript'
        },
        {
          label: 'JavaScript',
          value: 'javascript'
        },
        {
          label: 'React with TypeScript',
          value: 'tsx'
        },
        {
          label: 'CSS',
          value: 'css'
        },
        {
          label: 'HTML',
          value: 'markup'
        },
        {
          label: 'Python',
          value: 'python'
        },
        {
          label: 'JSON',
          value: 'json'
        },
        {
          label: 'YAML',
          value: 'yaml'
        },
        {
          label: 'SQL',
          value: 'sql'
        },
        {
          label: 'GraphQL',
          value: 'graphql'
        }
      ] satisfies Array<{ label: string; value: Language }>
    },
    {
      name: 'code',
      type: 'code',
      label: false,
      required: true
    }
  ]
};

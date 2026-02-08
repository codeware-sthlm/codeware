import { deepMerge } from '@codeware/shared/util/pure';
import type { UIField } from 'payload';

export type CalloutFieldProps = {
  description: Array<string>;
  kind?: 'info' | 'warning' | 'tip';
  title?: string;
};

type Props = {
  /** Custom field component properties */
  props: CalloutFieldProps;

  /** Override field configuration with selected properties */
  override?: Partial<UIField>;
};

/**
 * Callout UI field for informational content.
 */
export const calloutField = ({ props, override }: Props): UIField => {
  const field = deepMerge<UIField>(
    {
      name: 'callout',
      type: 'ui',
      admin: {
        components: {
          Field: {
            path: '@codeware/app-cms/ui/fields/callout/CalloutField.client',
            clientProps: props
          }
        },
        disableListColumn: true
      }
    },
    override ?? {}
  );

  return field;
};

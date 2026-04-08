import type { RowLabelProps } from '@payloadcms/ui';
import type { ArrayFieldServerProps, ServerComponentProps } from 'payload';

type RowLabelServer = Pick<RowLabelProps, 'path' | 'rowNumber'> & {
  rowLabel: string;
};

/**
 * Custom type for field server components in the CMS.
 */
export type FieldComponentServer<
  T extends 'ArrayField' | 'RowLabel' | undefined = undefined
> = React.FC<
  ServerComponentProps &
    (T extends 'ArrayField'
      ? ArrayFieldServerProps
      : T extends 'RowLabel'
        ? RowLabelServer
        : object)
>;

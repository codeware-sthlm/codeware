import type { RowLabelProps } from '@payloadcms/ui';
import type { ArrayFieldServerProps } from 'payload';

/**
 * Custom type for the array row label component.
 *
 * Couldn't find a dedicated type?
 */
export type ArrayRowLabel = ArrayFieldServerProps &
  Pick<RowLabelProps, 'rowNumber'> & { rowLabel: string };

'use client';

import type { CardBlockCard } from '@codeware/shared/util/payload-types';
import { type RowLabelProps, useRowLabel } from '@payloadcms/ui';

/**
 * Custom array row label for CardBlock cards array field.
 *
 * Displays the card title instead of the default row number.
 */
export const CardBlockArrayRowLabel: React.FC<RowLabelProps> = () => {
  // The cards group fields have a parent group type that is not included in `CardGroup`
  // so we need to use a record to access the card data
  const { data, rowNumber } = useRowLabel<CardBlockCard>();

  const { title } = data ?? {};

  // TODO: Language support
  return title ?? `Card ${String(rowNumber).padStart(2, '0')}`;
};

export default CardBlockArrayRowLabel;

'use client';

import type { CardBlockCard } from '@codeware/shared/util/payload-types';
import { type RowLabelProps, useRowLabel } from '@payloadcms/ui';

/**
 * Custom array row label for CardBlock cards array field.
 *
 * Displays the card title instead of the default row number.
 */
export const CardBlockArrayRowLabel: React.FC<RowLabelProps> = () => {
  const { data, rowNumber } = useRowLabel<CardBlockCard>();
  const { title } = data ?? {};

  // TODO: Language support
  return title ?? `Card ${String(rowNumber).padStart(2, '0')}`;
};

export default CardBlockArrayRowLabel;

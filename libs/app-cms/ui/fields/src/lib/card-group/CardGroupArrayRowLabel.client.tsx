'use client';

import type { CardGroup } from '@codeware/shared/util/payload-types';
import { type RowLabelProps, useRowLabel } from '@payloadcms/ui';

import { cardGroupFieldName } from './card-group.field';

/**
 * Custom array row label for any array field that contains CardGroup fields.
 *
 * Displays the card title instead of the default row number.
 */
export const CardGroupArrayRowLabel: React.FC<RowLabelProps> = () => {
  // The cards group fields have a parent group type that is not included in `CardGroup`
  // so we need to use a record to access the card data
  const { data, rowNumber } = useRowLabel<Record<string, CardGroup>>();

  const { title } = data[cardGroupFieldName] ?? {};

  // TODO: Language support
  return title ?? `Card ${String(rowNumber).padStart(2, '0')}`;
};

export default CardGroupArrayRowLabel;

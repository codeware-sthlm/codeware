import type { Tour } from '@codeware/shared/util/payload-types';

import type { FieldComponentServer } from './component-types';

/**
 * Custom array row label for the tour itinerary array field.
 *
 * Shows the day position and its title so collapsed rows stay distinguishable.
 * The position alone carries the "day" meaning, which keeps the label free of
 * any word that would need translating.
 *
 * Deliberately a server component: the client variant put a rendered element
 * into nested array row state, which `reduceToSerializableFields` only strips
 * at the top level — the SEO plugin then failed to serialize the form state.
 */
export const TourItineraryRowLabel: FieldComponentServer<'RowLabel'> = ({
  data,
  rowLabel,
  rowNumber
}) => {
  const { itinerary } = data as Pick<Tour, 'itinerary'>;

  // `rowNumber` is 1-based for server row labels
  const position = rowNumber ?? 1;
  const title = itinerary?.[position - 1]?.title;

  return title ? `${position} — ${title}` : rowLabel;
};

export default TourItineraryRowLabel;

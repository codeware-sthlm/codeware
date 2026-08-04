import type { Tour } from '@codeware/shared/util/payload-types';
import type { Payload, TypedLocale } from 'payload';

export type TourData = Pick<
  Tour,
  | 'bookingDeadline'
  | 'content'
  | 'currency'
  | 'departureDate'
  | 'departureNote'
  | 'destination'
  | 'duration'
  | 'heroImage'
  | 'included'
  | 'intent'
  | 'itinerary'
  | 'notIncluded'
  | 'price'
  | 'summary'
  | 'tenant'
  | 'title'
> & {
  slug: string;
};

/**
 * Ensure that a tour exist with the given slug.
 *
 * @param payload - Payload instance
 * @param data - Tour data
 * @param options - Seed options
 * @returns The created tour or the id if the tour exists
 */
export async function ensureTour(
  payload: Payload,
  data: TourData,
  options: { locale: TypedLocale; transactionID: string | number | undefined }
): Promise<Tour | number> {
  const { locale, transactionID } = options;
  const { slug } = data;

  // Check if the tour exists with the given slug
  const tours = await payload.find({
    collection: 'tours',
    where: {
      slug: { equals: slug }
    },
    depth: 0,
    req: { transactionID },
    limit: 1
  });

  if (tours.totalDocs) {
    return tours.docs[0].id;
  }

  // No tour found, create one

  const tour = await payload.create({
    collection: 'tours',
    data: {
      ...data,
      _status: 'published'
    },
    context: { seedAction: true },
    locale,
    req: { transactionID }
  });

  return tour;
}

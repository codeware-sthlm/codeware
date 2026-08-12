import type {
  Media,
  StockMedia,
  Tour
} from '@codeware/shared/util/payload-types';
import { formatDayOnlyDate } from '@codeware/shared/util/pure';

/**
 * Itinerary days are counted from the departure, which is stored at midnight
 * UTC — see `formatDayOnlyDate` for why that has to be honoured on the way out.
 */
const DAY_ONLY_TIME_ZONE = 'UTC';

/**
 * Resolve the hero image of a tour to a renderable document.
 *
 * `heroImage` is a polymorphic upload — it points at either the shared
 * `stock-media` library or the workspace's own `media`. Both carry the same
 * image sizes, so callers only need the resolved document.
 *
 * @returns The image document, or `null` when it is unresolved (depth 0)
 */
export function resolveTourHero(
  heroImage: Tour['heroImage'] | null | undefined
): Media | StockMedia | null {
  const value = heroImage?.value;
  return typeof value === 'object' ? value : null;
}

/**
 * Format a tour price in its currency.
 *
 * Tour prices are quoted in whole units, so decimals are dropped.
 */
export function formatPrice(
  price: number,
  currency: Tour['currency'],
  locale: string
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0
  }).format(price);
}

/**
 * Format a tour date (departure, booking deadline) as a readable day.
 *
 * Returns an empty string for a missing date so callers can render it inline
 * without guarding first.
 */
export function formatTourDate(
  date: string | null | undefined,
  locale: string
): string {
  if (!date) {
    return '';
  }
  return formatDayOnlyDate(date, locale);
}

/**
 * Resolve the calendar date of an itinerary day.
 *
 * Days are sequential from departure, so day N is departure + (N - 1). The year
 * is left off — it is already stated by the departure date.
 *
 * @param departureDate - The day the tour departs
 * @param dayIndex - Zero-based position in the itinerary
 */
export function formatTourDayDate(
  departureDate: string | null | undefined,
  dayIndex: number,
  locale: string
): string {
  if (!departureDate) {
    return '';
  }
  const date = new Date(departureDate);
  date.setUTCDate(date.getUTCDate() + dayIndex);
  return date.toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    timeZone: DAY_ONLY_TIME_ZONE
  });
}

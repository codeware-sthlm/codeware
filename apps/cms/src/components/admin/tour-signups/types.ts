import type { TourSignupStatus } from '@codeware/app-cms/ui/tour-signups';

/** One signup, flattened for the panel. */
export type TourSignupItem = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  people: number;
  status: TourSignupStatus;
  /** Place in the waiting list; null unless queued */
  queuePosition: number | null;
  notes: string | null;
  /** ISO timestamp the customer signed up */
  signedUpAt: string;
  /** ISO timestamp the status last moved, when it has */
  statusChangedAt: string | null;
  termsAcceptedAt: string | null;
  /** Personal data cleared by retention */
  anonymized: boolean;
};

/** What the panel needs to know about the tour it belongs to. */
export type TourSignupsSummary = {
  tourId: number;
  maxCustomers: number | null;
  /** People holding a seat */
  booked: number;
  /** People on the waiting list */
  waiting: number;
};

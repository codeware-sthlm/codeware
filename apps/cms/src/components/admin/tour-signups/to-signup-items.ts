import type { TourSignup } from '@codeware/shared/util/payload-types';

import type { TourSignupItem } from './types';

/**
 * Flatten signup documents for the panel.
 *
 * A row anonymised by retention keeps its seat but loses its person, and the
 * panel has to say so rather than render empty cells — `anonymizedAt` is what
 * separates "cleared on purpose" from "the guide never filled it in".
 */
export function toSignupItems(docs: Array<TourSignup>): Array<TourSignupItem> {
  return docs.map((doc) => ({
    id: doc.id,
    name: doc.name,
    email: doc.email,
    phone: doc.phone ?? null,
    people: doc.people,
    status: doc.status,
    queuePosition: doc.queuePosition ?? null,
    notes: doc.notes ?? null,
    signedUpAt: doc.createdAt,
    statusChangedAt: doc.statusChangedAt ?? null,
    termsAcceptedAt: doc.termsAcceptedAt ?? null,
    anonymized: Boolean(doc.anonymizedAt)
  }));
}

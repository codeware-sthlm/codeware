import { getTourSignups, mapToRuntime } from '@codeware/app-cms/data-access';
import { customT } from '@codeware/app-cms/util/i18n';
import type { UIFieldServerComponent } from 'payload';
import React from 'react';

import { LegalPagesStatus } from './LegalPagesStatus';
import { toSignupItems } from './to-signup-items';
import { TourSignupsPanel } from './TourSignupsPanel.client';

/** Signups loaded into the tour view; beyond this the collection list is the place */
const PANEL_LIMIT = 500;

/**
 * The tour's own signup list, rendered inside its edit view.
 *
 * The guide works here rather than in a separate collection — the tour is the
 * thing they think about, and the list is only meaningful next to the capacity
 * it fills. Loaded server-side under the editor's own access control.
 */
const TourSignupsField: UIFieldServerComponent = async ({
  data,
  i18n,
  id,
  payload,
  user
}) => {
  const t = customT(i18n.t);

  // Nothing to show before the tour exists — signups reference it by id
  if (typeof id !== 'number') {
    return (
      <p className="text-muted-foreground text-sm">
        {t('tourSignups:emptyUnsaved')}
      </p>
    );
  }

  const runtime = mapToRuntime(payload, user);
  const result = await getTourSignups(runtime, {
    where: { tour: { equals: id } },
    limit: PANEL_LIMIT
  });

  const docs = result?.docs ?? [];

  const booked = docs
    .filter((doc) => doc.status === 'booked')
    .reduce((total, doc) => total + (doc.people ?? 0), 0);
  const waiting = docs
    .filter((doc) => doc.status === 'waiting')
    .reduce((total, doc) => total + (doc.people ?? 0), 0);

  // Read from the form rather than the saved document, so raising the maximum
  // and looking at the queue in the same sitting agrees with itself
  const maxCustomers =
    typeof data?.['maxCustomers'] === 'number' ? data['maxCustomers'] : null;

  return (
    <>
      {/* Configured once in Site Settings and then easy to forget, so its
          state belongs where signups are actually worked on */}
      <LegalPagesStatus
        i18n={i18n}
        payload={payload}
        tenant={data?.['tenant']}
        user={user}
      />
      <TourSignupsPanel
        signups={toSignupItems(docs)}
        summary={{ tourId: id, maxCustomers, booked, waiting }}
        language={i18n.language}
      />
    </>
  );
};

export default TourSignupsField;

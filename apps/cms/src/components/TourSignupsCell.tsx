import {
  getTourSignupTotals,
  mapToRuntime
} from '@codeware/app-cms/data-access';
import { TourFillBar } from '@codeware/app-cms/ui/tour-signups';
import { customT } from '@codeware/app-cms/util/i18n';
import Link from 'next/link';
import type { DefaultServerCellComponentProps } from 'payload';
import React from 'react';

/**
 * How full a tour is, linking into that tour's signups.
 *
 * Totalled per row rather than through a virtual field on `tours`, so the
 * query is paid only when this column renders — a virtual field would run on
 * every tour read, including the site rendering a tour listing.
 *
 * Cell components get no `user`, so the totals run with `overrideAccess`. That
 * is not a widening: signups are pinned to their tour's tenant on create
 * (`verifyTourTenant`), so a tour the viewer can already see in this list can
 * only be counting its own workspace's signups.
 */
export const TourSignupsCell: React.FC<
  DefaultServerCellComponentProps<never, never>
> = async ({ i18n, payload, rowData }) => {
  const tourId = rowData?.['id'];

  if (typeof tourId !== 'number') {
    return null;
  }

  const totals = await getTourSignupTotals(mapToRuntime(payload, null), [
    tourId
  ]);
  const { booked, waiting, signups } = totals[tourId];

  const t = customT(i18n.t);

  const maxCustomers =
    typeof rowData?.['maxCustomers'] === 'number'
      ? rowData['maxCustomers']
      : null;

  // Nothing to show before anyone has signed up, and no bar to draw without a
  // maximum — an empty cell says "no signups" more clearly than "0 / —"
  if (!signups && !maxCustomers) {
    return <span className="text-muted-foreground flex justify-start">—</span>;
  }

  const adminRoute = payload.config.routes?.admin ?? '/admin';

  return (
    // Payload centres list cell content by default; a fill bar reads as a
    // measure and has to start where every other column's text starts
    <Link
      className="flex justify-start text-left"
      href={`${adminRoute}/collections/tours/${tourId}`}
      prefetch={false}
    >
      <TourFillBar
        booked={booked}
        maxCustomers={maxCustomers}
        waiting={waiting}
        size="sm"
        labels={{
          full: t('tourSignups:full'),
          overbooked: t('tourSignups:overbooked'),
          waiting: (count) => t('tourSignups:waitingCount', { count }),
          summary: t('tourSignups:fillSummary', {
            booked,
            max: maxCustomers ?? booked
          })
        }}
      />
    </Link>
  );
};

export default TourSignupsCell;

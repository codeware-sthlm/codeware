import { getTours, mapToRuntime } from '@codeware/app-cms/data-access';
import type { ServerProps } from 'payload';
import React from 'react';

import { getTenantWhere } from '../utils/tenant-where';

import { TourFilter } from './TourFilter.client';

/** Tours offered in the dropdown; a workspace with more than this needs search */
const TOUR_OPTIONS_LIMIT = 100;

/**
 * Loads the tours the signups list can be filtered by.
 *
 * A server component so the options are fetched under the viewer's own access
 * and workspace scope — the client half only writes a query parameter, and a
 * dropdown that offered another workspace's tour titles would leak them.
 */
const TourFilterField: React.FC<ServerProps> = async ({ payload, user }) => {
  const runtime = mapToRuntime(payload, user ?? null);
  const tenantWhere = await getTenantWhere(user);

  const tours = await getTours(runtime, {
    where: tenantWhere,
    limit: TOUR_OPTIONS_LIMIT
  });

  return (
    <TourFilter
      tours={(tours?.docs ?? []).map((tour) => ({
        id: tour.id,
        title: tour.title
      }))}
    />
  );
};

export default TourFilterField;

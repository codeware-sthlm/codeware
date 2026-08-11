'use client';

import type {
  TranslationsKeys,
  TranslationsObject
} from '@codeware/app-cms/util/i18n';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@codeware/shared/ui/shadcn/components/select';
import { useTranslation } from '@payloadcms/ui';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React, { useCallback, useTransition } from 'react';

/** Select needs a non-empty value for the "no filter" option */
const ALL_TOURS = 'all';

/** Payload's own list query param for an equals constraint */
const PARAM = 'where[tour][equals]';

type Props = {
  /** Tours offered in the dropdown, already scoped to the workspace */
  tours: Array<{ id: number; title: string }>;
};

/**
 * Quick filter above the signups list: pick a tour, see only its signups.
 *
 * Payload's own filter panel can do this in four clicks; a signup list is
 * almost always read one tour at a time, so it gets one.
 *
 * Writes Payload's own `where` query parameter rather than keeping state, so
 * the list reloads through its normal path and the filtered view stays
 * linkable — which is what makes it worth sending someone.
 */
export const TourFilter: React.FC<Props> = ({ tours }) => {
  const { t } = useTranslation<TranslationsObject, TranslationsKeys>();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const selected = searchParams?.get(PARAM) ?? ALL_TOURS;

  const onChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams?.toString() ?? '');

      if (value === ALL_TOURS) {
        params.delete(PARAM);
      } else {
        params.set(PARAM, value);
      }
      // A filter change means a different result set, so the old page number
      // is meaningless — and page 3 of a one-page result renders empty
      params.delete('page');

      const query = params.toString();
      startTransition(() => {
        router.push(query ? `${pathname}?${query}` : pathname, {
          scroll: false
        });
      });
    },
    [pathname, router, searchParams]
  );

  if (!tours.length) {
    return null;
  }

  return (
    <div className="codeware-admin twp mb-4 flex items-center gap-2">
      <Select value={selected} onValueChange={onChange}>
        <SelectTrigger
          className="w-64"
          aria-label={t('tourSignups:filterByTour')}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_TOURS}>{t('tourSignups:allTours')}</SelectItem>
          {tours.map((tour) => (
            <SelectItem key={tour.id} value={String(tour.id)}>
              {tour.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default TourFilter;

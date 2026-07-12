'use client';

import { useAuth, usePreferences, useTranslation } from '@payloadcms/ui';
import type { CollectionSlug } from 'payload';
import { useEffect, useState } from 'react';

import type { GettingStartedStep } from '@codeware/app-cms/ui/dashboard';
import type {
  TranslationsKeys,
  TranslationsObject
} from '@codeware/app-cms/util/i18n';
import type { User } from '@codeware/shared/util/payload-types';

import {
  DASHBOARD_PREFERENCES_KEY,
  type DashboardPreferences
} from './dashboard-preferences';
import { hasCreatePermission } from './has-create-permission';

/**
 * Custom event that re-shows the getting-started checklist after dismissal,
 * e.g. from the command palette (which also clears the stored preference).
 */
export const SHOW_GETTING_STARTED_EVENT = 'cdwr:show-getting-started';

/**
 * First-time editor checklist for the dashboard Home tab, with its dismissal
 * backed by the user's stored admin preferences.
 *
 * Owns the dismissal state (hydrated on mount, persisted on dismiss with a
 * merge write) and the {@link SHOW_GETTING_STARTED_EVENT} listener that
 * re-shows the checklist on demand.
 *
 * @param counts - Live document counts per collection, used to tick off steps.
 * @returns Checklist visibility, the computed steps and a dismiss handler.
 */
export function useGettingStarted(counts: Record<string, number>): {
  showChecklist: boolean;
  checklistSteps: GettingStartedStep[];
  dismissChecklist: () => void;
} {
  const { permissions, user } = useAuth<User>();
  const { getPreference, setPreference } = usePreferences();
  const { t } = useTranslation<TranslationsObject, TranslationsKeys>();

  // Stays undefined (checklist hidden) until preferences have loaded
  const [checklistDismissed, setChecklistDismissed] = useState<boolean>();

  // Re-show on demand (palette action); the sender clears the preference
  useEffect(() => {
    const show = () => setChecklistDismissed(false);
    window.addEventListener(SHOW_GETTING_STARTED_EVENT, show);
    return () => window.removeEventListener(SHOW_GETTING_STARTED_EVENT, show);
  }, []);

  // Hydrate the dismissal state from the user's stored admin preferences
  useEffect(() => {
    let cancelled = false;
    getPreference<DashboardPreferences>(DASHBOARD_PREFERENCES_KEY)
      .then((preferences) => {
        if (cancelled) return;
        setChecklistDismissed(Boolean(preferences?.gettingStartedDismissed));
      })
      .catch(() => undefined);
    return () => {
      // Prevents state updates if the tab unmounts before the async preference load completes
      cancelled = true;
    };
  }, [getPreference]);

  const dismissChecklist = () => {
    setChecklistDismissed(true);
    void setPreference<DashboardPreferences>(
      DASHBOARD_PREFERENCES_KEY,
      { gettingStartedDismissed: true },
      true
    );
  };

  // First-time editor checklist, ticked off from live collection counts.
  // Steps are limited to collections the user can create in (same gate as the
  // task cards), so we never suggest an action they can't take.
  const checklistSteps: GettingStartedStep[] = (
    [
      { slug: 'posts', labelKey: 'dashboard:taskWritePost' },
      { slug: 'pages', labelKey: 'dashboard:taskAddPage' },
      { slug: 'media', labelKey: 'dashboard:taskUploadImage' }
    ] satisfies { slug: CollectionSlug; labelKey: TranslationsKeys }[]
  )
    .filter(({ slug }) => hasCreatePermission(permissions, slug))
    .map(({ slug, labelKey }) => ({
      href: `/admin/collections/${slug}/create`,
      label: t(labelKey),
      done: (counts[slug] ?? 0) > 0
    }));

  // Dismissal is the only hide condition (beyond having any steps left): a
  // fully ticked card reads as "all done" and stays discoverable until the
  // editor closes it themselves (or brings it back via the palette).
  const showChecklist =
    user?.role !== 'system-user' &&
    checklistDismissed === false &&
    checklistSteps.length > 0;

  return { showChecklist, checklistSteps, dismissChecklist };
}

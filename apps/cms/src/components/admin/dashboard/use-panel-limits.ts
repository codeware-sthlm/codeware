'use client';

import { usePreferences } from '@payloadcms/ui';
import { useEffect, useState } from 'react';

import {
  DASHBOARD_PREFERENCES_KEY,
  type DashboardPreferences
} from './dashboard-preferences';
import { PANEL_DEFAULT_LIMIT, isLimitOption } from './panel-limits';

/**
 * Row limits for the recent-activity and drafts panels, backed by the user's
 * stored admin preferences.
 *
 * Hydrates once on mount and exposes change handlers that persist with merge
 * writes, keeping sibling dashboard preferences intact.
 *
 * @returns The current limits and their persisting change handlers.
 */
export function usePanelLimits(): {
  recentLimit: number;
  draftsLimit: number;
  changeRecentLimit: (value: number) => void;
  changeDraftsLimit: (value: number) => void;
} {
  const { getPreference, setPreference } = usePreferences();

  const [recentLimit, setRecentLimit] = useState(PANEL_DEFAULT_LIMIT);
  const [draftsLimit, setDraftsLimit] = useState(PANEL_DEFAULT_LIMIT);

  // Hydrate panel limits from the user's stored admin preferences
  useEffect(() => {
    let cancelled = false;
    getPreference<DashboardPreferences>(DASHBOARD_PREFERENCES_KEY)
      .then((preferences) => {
        if (cancelled || !preferences) return;
        if (isLimitOption(preferences.recentLimit)) {
          setRecentLimit(preferences.recentLimit);
        }
        if (isLimitOption(preferences.draftsLimit)) {
          setDraftsLimit(preferences.draftsLimit);
        }
      })
      .catch(() => undefined);
    return () => {
      // Prevents state updates if the tab unmounts before the async preference load completes
      cancelled = true;
    };
  }, [getPreference]);

  const changeRecentLimit = (value: number) => {
    setRecentLimit(value);
    void setPreference<DashboardPreferences>(
      DASHBOARD_PREFERENCES_KEY,
      { recentLimit: value },
      true
    );
  };

  const changeDraftsLimit = (value: number) => {
    setDraftsLimit(value);
    void setPreference<DashboardPreferences>(
      DASHBOARD_PREFERENCES_KEY,
      { draftsLimit: value },
      true
    );
  };

  return { recentLimit, draftsLimit, changeRecentLimit, changeDraftsLimit };
}

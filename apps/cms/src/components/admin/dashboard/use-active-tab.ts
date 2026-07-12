'use client';

import { usePreferences } from '@payloadcms/ui';
import { useState } from 'react';

import type { DashboardTab } from '@codeware/app-cms/ui/dashboard';

import {
  DASHBOARD_PREFERENCES_KEY,
  type DashboardPreferences
} from './dashboard-preferences';

/**
 * Active dashboard tab, persisted to the user's stored admin preferences.
 *
 * Seeded from the server-resolved preference, so the first paint is already
 * the right tab — no hydration effect, no flash.
 *
 * @param initial - Tab resolved server-side from the user's stored preference.
 * @returns The active tab and a change handler that persists the choice.
 */
export function useActiveTab(initial: DashboardTab): {
  activeTab: DashboardTab;
  changeTab: (value: string) => void;
} {
  const { setPreference } = usePreferences();
  const [activeTab, setActiveTab] = useState<DashboardTab>(initial);

  const changeTab = (value: string) => {
    const tab = value as DashboardTab;
    setActiveTab(tab);
    // Merge flag preserves sibling dashboard preferences (limits, checklist).
    void setPreference<DashboardPreferences>(
      DASHBOARD_PREFERENCES_KEY,
      { activeTab: tab },
      true
    );
  };

  return { activeTab, changeTab };
}

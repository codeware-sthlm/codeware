import type { DashboardTab } from '@codeware/app-cms/ui/dashboard';

/** Payload user-preferences key the dashboard stores its view state under. */
export const DASHBOARD_PREFERENCES_KEY = 'admin-dashboard';

/** Tab shown when the user has no stored preference (or it's unreadable). */
export const DEFAULT_DASHBOARD_TAB: DashboardTab = 'home';

const DASHBOARD_TABS: readonly DashboardTab[] = ['home', 'content', 'platform'];

/**
 * Narrow an unknown stored value to a valid {@link DashboardTab}.
 *
 * Shape only, deliberately: whether the user may *see* a tab is a different
 * question, answered where the tab is resolved server-side. Folding the role
 * check in here would make a pure predicate need a user.
 */
export const isDashboardTab = (value: unknown): value is DashboardTab =>
  typeof value === 'string' &&
  (DASHBOARD_TABS as readonly string[]).includes(value);

/** Shape of the JSON payload stored under {@link DASHBOARD_PREFERENCES_KEY}. */
export type DashboardPreferences = {
  activeTab?: DashboardTab;
  draftsLimit?: number;
  gettingStartedDismissed?: boolean;
  recentLimit?: number;
};

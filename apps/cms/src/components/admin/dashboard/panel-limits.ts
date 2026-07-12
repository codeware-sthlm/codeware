/**
 * Row-count options offered by the dashboard panel limit toggles.
 *
 * Shared between the server view (fetches the largest option so switching
 * limits never requires a refetch) and the client (renders the toggles and
 * slices the lists).
 */
export const PANEL_LIMIT_OPTIONS: readonly number[] = [5, 10, 20];

/** Rows shown in a dashboard panel before the user picks a limit. */
export const PANEL_DEFAULT_LIMIT = PANEL_LIMIT_OPTIONS[0];

/** Largest option — the amount of rows the server fetches per panel. */
export const PANEL_MAX_LIMIT = Math.max(...PANEL_LIMIT_OPTIONS);

/** Whether a stored preference value is still a valid limit option. */
export function isLimitOption(value: unknown): value is number {
  return typeof value === 'number' && PANEL_LIMIT_OPTIONS.includes(value);
}

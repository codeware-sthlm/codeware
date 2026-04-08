import type { Locator } from '@playwright/test';

/**
 * Expand a collapsed Payload Collapsible.
 *
 * Pass the row locator that contains the toggle, e.g.:
 *   - blocks field row:  page.locator('.blocks-field__row').first()
 *   - array field row:   page.locator('.array-field__row').first()
 *
 * Payload's Collapsible renders the toggle button with
 * `.collapsible__toggle--collapsed` when collapsed (no aria-expanded attribute).
 */
export async function expandCollapsible(row: Locator): Promise<void> {
  await row.locator('.collapsible__toggle--collapsed').click();
}

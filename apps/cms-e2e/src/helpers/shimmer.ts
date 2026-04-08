import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Wait for all Payload skeleton loaders to disappear.
 *
 * Payload shows `.shimmer-effect` elements while initializing newly-added block
 * rows (server request resolves the block's initial form state). Interactions
 * inside the block before this resolves will fail or hit stale DOM.
 *
 * Uses a two-phase wait to avoid a race where `toHaveCount(0)` would pass
 * immediately before the shimmer has been added to the DOM.
 *
 * @param page Playwright Page object to scope the search for shimmers
 * @param timeout Maximum time to wait for shimmers to disappear, in milliseconds (default `20_000` = 20 seconds)
 */
export async function waitForShimmer(
  page: Page,
  timeout = 20_000
): Promise<void> {
  // Phase 1: wait for at least one shimmer to appear (short timeout — if none
  // appear the shimmer was already gone before we checked, which is also fine).
  await page
    .locator('.shimmer-effect')
    .first()
    .waitFor({ state: 'visible', timeout: 3_000 })
    .catch(() => undefined);

  // Phase 2: wait for all shimmers to clear
  await expect(page.locator('.shimmer-effect')).toHaveCount(0, { timeout });
}

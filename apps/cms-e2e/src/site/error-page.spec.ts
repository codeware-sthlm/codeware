import { expect, test } from '../fixtures';

/**
 * Tests the global error boundary (`global-error.tsx`) by navigating to a
 * dev-only route that intentionally throws — verifying the maintenance page
 * renders correctly without providers, styles, or DB access.
 */
test.describe('maintenance error page', () => {
  test('renders technical difficulties page on unhandled error', async ({
    page
  }) => {
    await page.goto('/test/error');

    await expect(
      page.getByRole('heading', { name: 'We\'re having technical difficulties' })
    ).toBeVisible();

    await expect(
      page.getByText('The service is temporarily unavailable')
    ).toBeVisible();
  });

  test('shows error reference digest when available', async ({ page }) => {
    await page.goto('/test/error');

    // Next.js includes a digest in the error object for server errors
    const reference = page.getByText('Reference:');
    await expect(reference).toBeVisible();
  });
});

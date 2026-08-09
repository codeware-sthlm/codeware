import { expect, test } from '../fixtures';

/**
 * Tests the global error boundary (`global-error.tsx`) by navigating to a
 * dev-only route that intentionally throws — verifying the maintenance page
 * renders correctly without providers, styles, or DB access.
 */
test.describe('maintenance error page', () => {
  // The route throws on purpose — that 500 is the subject of these tests
  test.use({ allowedErrors: ['/test/error'] });

  test('renders technical difficulties page on unhandled error', async ({
    page
  }) => {
    await page.goto('/test/error');

    await expect(
      page.getByRole('heading', { name: 'Something went wrong' })
    ).toBeVisible();

    await expect(
      page.getByText('The service is temporarily unavailable')
    ).toBeVisible();
  });

  test('shows error reference digest', async ({ page }) => {
    await page.goto('/test/error');

    // Next.js includes a digest in the error object for server errors
    const reference = page.getByText('Reference:');
    await expect(reference).toBeVisible();
  });
});

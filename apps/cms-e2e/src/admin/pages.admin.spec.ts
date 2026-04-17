import { expect, test } from '../fixtures';
import { expandCollapsible } from '../helpers/collapsible';
import { loginAs } from '../helpers/login';
import { waitForShimmer } from '../helpers/shimmer';

test.describe('/admin/collections/pages', () => {
  // Each test gets a clean browser context with no session cookies
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(
    async ({ page }) => await loginAs(page, 'tenantAdmin', { navigate: true })
  );

  test('lists all seeded pages', async ({ page }) => {
    await page.goto('/admin/collections/pages');

    await expect(page.getByRole('link', { name: 'Home' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Lunar Maria' })).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Lunar Craters' })
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Lunar Phases' })
    ).toBeVisible();
  });

  test('creates a new page and verifies it appears in the list', async ({
    page
  }) => {
    test.skip(!!process.env['CI'], 'Shimmer does not always clear in CI');
    const testPageName = `Test Page ${Date.now()}`;

    await page.goto('/admin/collections/pages/create');

    await page.getByLabel('Name').fill(testPageName);
    await page.getByLabel('Header').fill('Test Header');
    await page.getByLabel('Slug').fill(`test-page-${Date.now()}`);

    // Layout builder is required
    // Add a Content block to satisfy the "at least 1 row" constraint.
    await page.getByRole('button', { name: 'Add block' }).click();
    await page.getByTitle(/^Content$/).click();

    // Wait for the block picker drawer to close before interacting with the block
    await expect(page.getByTitle(/^Content$/)).toBeHidden();

    // Payload initializes newly-added block rows via a server request.
    // Until that resolves the row header shows a skeleton — wait for it to clear.
    await waitForShimmer(page);

    // The layout blocks field has initCollapsed:true, so the newly-added Content block
    // starts collapsed. Expand it so its inner controls become accessible.
    await expandCollapsible(page.locator('.blocks-field__row').first());

    // The columns array inside the Content block starts empty — add one column first.
    await page.getByRole('button', { name: 'Add Column' }).click();

    // Adding a column also triggers a shimmer while Payload initializes the new row.
    await waitForShimmer(page);

    // The new column row is also collapsed — expand it before filling its fields.
    await expandCollapsible(page.locator('.array-field__row').first());

    // Column width defaults to full

    // The Lexical rich text editor is a contenteditable with role="textbox".
    // Scope to the column row to avoid matching the Slug input, which is rendered
    // outside the tabs section and appears after the layout builder in the DOM.
    await page
      .locator('.array-field__row')
      .first()
      .getByRole('textbox')
      .fill('Hello from test!');

    await page.getByRole('button', { name: 'Publish changes' }).click();

    // Payload navigates from /create to the new document URL on success.
    // Waiting for the URL change is more reliable than catching the toast,
    // which may appear and disappear before an assertion can run.
    await page.waitForURL(
      (url) =>
        url.pathname.includes('/admin/collections/pages/') &&
        !url.pathname.endsWith('/create'),
      { timeout: 15_000 }
    );

    // Toast should still be visible right after the navigation settles
    await expect(page.getByText('successfully')).toBeVisible();

    // Verify the page now appears in the list
    await page.goto('/admin/collections/pages');
    await expect(page.getByRole('link', { name: testPageName })).toBeVisible();
  });
});

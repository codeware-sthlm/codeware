import { expect, test } from '../fixtures';
import { loginAs } from '../helpers/login';

test.describe('/admin/collections/posts', () => {
  // Each test gets a clean browser context with no session cookies
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(
    async ({ page }) => await loginAs(page, 'tenantAdmin', { navigate: true })
  );

  test('lists all seeded posts', async ({ page }) => {
    await page.goto('/admin/collections/posts');

    await expect(
      page.getByRole('link', { name: 'Lunar Highlands' })
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'The Lunar Atmosphere' })
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'Lunar Water' })).toBeVisible();
    await expect(
      page.getByRole('link', { name: "The Moon's Formation" })
    ).toBeVisible();
  });

  test('opens Lunar Highlands and title field is editable', async ({
    page
  }) => {
    await page.goto('/admin/collections/posts');

    await page.getByRole('link', { name: 'Lunar Highlands' }).click();

    await expect(page).toHaveURL(/\/admin\/collections\/posts\//);

    const titleField = page.getByLabel('Title');
    await expect(titleField).toBeVisible();
    await expect(titleField).toHaveValue('Lunar Highlands');
    await expect(titleField).toBeEditable();
  });
});

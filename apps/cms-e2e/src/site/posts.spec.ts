import { expect, test } from '../fixtures';

test.describe('/posts', () => {
  test('renders posts list', async ({ page }) => {
    await page.goto('/posts');

    await expect(
      page.getByRole('link', { name: 'Lunar Highlands' })
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'The Lunar Atmosphere' })
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'Lunar Water' })).toBeVisible();
  });

  test('navigates to a post', async ({ page }) => {
    await page.goto('/posts');

    await page.getByRole('link', { name: 'Lunar Highlands' }).click();

    await expect(page).toHaveURL(/\/posts\/lunar-highlands/);
  });

  test('post detail renders title', async ({ page }) => {
    await page.goto('/posts/lunar-highlands');

    // Scope to article header to avoid matching the same title in rich text content
    await expect(
      page
        .locator('article header')
        .getByRole('heading', { name: 'Lunar Highlands' })
    ).toBeVisible();
  });

  test('returns 404 for unknown post slug', async ({ page }) => {
    await page.goto('/posts/unknown-post-slug-xyz');

    await expect(
      page.getByRole('heading', { name: 'Page not found' })
    ).toBeVisible();
  });
});

import { expect, test } from '../fixtures';

test.describe('dynamic pages', () => {
  test('renders lunar-maria page', async ({ page }) => {
    await page.goto('/lunar-maria');

    await expect(
      page.getByRole('heading', { name: 'The Dark Plains of the Moon' })
    ).toBeVisible();
  });

  test('renders lunar-craters page', async ({ page }) => {
    await page.goto('/lunar-craters');

    await expect(
      page.getByRole('heading', { name: 'Impact Features on the Moon' })
    ).toBeVisible();
  });

  test('renders lunar-phases page', async ({ page }) => {
    await page.goto('/lunar-phases');

    await expect(
      page.getByRole('heading', { name: 'The Changing Face of the Moon' })
    ).toBeVisible();
  });

  test('returns 404 for unknown slug', async ({ page }) => {
    await page.goto('/unknown-page-slug-xyz');

    await expect(
      page.getByRole('heading', { name: 'Page not found' })
    ).toBeVisible();
  });
});

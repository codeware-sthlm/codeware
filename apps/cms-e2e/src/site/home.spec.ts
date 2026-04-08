import { expect, test } from '../fixtures';

test.describe('landing page', () => {
  test('renders moon home page', async ({ page }) => {
    await page.goto('/');

    await expect(
      page.getByRole('heading', { name: 'Look at the silver moon.' })
    ).toBeVisible();
  });

  test('has navigation', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible();
  });
});

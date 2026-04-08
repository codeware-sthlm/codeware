import { expect, test } from '../fixtures';

test.describe('navigation', () => {
  test('contains links to all seeded pages', async ({ page }) => {
    await page.goto('/');

    const nav = page.getByRole('navigation', { name: 'Main' });
    await expect(nav.getByRole('link', { name: 'Lunar Maria' })).toBeVisible();
    await expect(
      nav.getByRole('link', { name: 'Lunar Craters' })
    ).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Lunar Phases' })).toBeVisible();
  });

  test('navigation link routes to correct page', async ({ page }) => {
    await page.goto('/');

    await page
      .getByRole('navigation', { name: 'Main' })
      .getByRole('link', { name: 'Lunar Maria' })
      .click();

    await expect(page).toHaveURL(/\/lunar-maria/);
    await expect(
      page.getByRole('heading', { name: 'The Dark Plains of the Moon' })
    ).toBeVisible();
  });
});

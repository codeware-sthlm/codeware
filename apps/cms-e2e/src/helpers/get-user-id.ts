import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

/** Look up a user by email and return their ID. */
export async function getUserId(page: Page, email: string): Promise<number> {
  const res = await page.request.get(
    `/api/users?where[email][equals]=${email}&limit=1`
  );
  expect(res.status()).toBe(200);
  const id = (await res.json()).docs?.[0]?.id as number | undefined;
  if (!id) throw new Error(`User not found: ${email}`);
  return id;
}

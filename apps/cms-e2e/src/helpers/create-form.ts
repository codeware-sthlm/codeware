import type { Form } from '@codeware/shared/util/payload-types';
import { type Page, expect } from '@playwright/test';

/** Minimal Lexical value for the required confirmation message */
const confirmationMessage = {
  root: {
    type: 'root',
    children: [
      {
        type: 'paragraph',
        version: 1,
        children: [{ type: 'text', text: 'Thanks!', version: 1 }]
      }
    ],
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1
  }
};

/**
 * Create a form for the tenant the page session is logged in to.
 *
 * Forms are not part of the seed data, so tests that need one create it up
 * front. `confirmationMessage` is required by the form-builder plugin even
 * though the admin UI only shows it for the message confirmation type.
 *
 * @param page - Page with an authenticated admin session
 * @param title - Form title
 * @returns The created form
 */
export async function createForm(page: Page, title: string): Promise<Form> {
  const res = await page.request.post('/api/forms', {
    data: {
      title,
      confirmationType: 'message',
      confirmationMessage,
      fields: [{ blockType: 'email', name: 'email', label: 'Email', width: 6 }]
    }
  });
  expect(res.status(), await res.text()).toBe(201);

  return (await res.json()).doc;
}

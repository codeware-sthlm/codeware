import { expect, test } from '../fixtures';

test.describe('POST /api/form-submissions', () => {
  test('returns 400 when required fields are missing', async ({ request }) => {
    const response = await request.post('/api/form-submissions', {
      data: {}
    });

    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(body.error).toBe('Missing required fields');
  });
});

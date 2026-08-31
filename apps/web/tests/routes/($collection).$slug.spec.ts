import { findDoc } from '@codeware/shared/util/payload-api';

import { loader } from '../../app/routes/($collection).$slug';
import type { TypedLoaderFunctionArgs } from '../../app/utils/types';

vi.mock('@codeware/shared/util/payload-api', () => ({
  findDoc: vi.fn()
}));

vi.mock('../../app/utils/get-payload-request-options', () => ({
  getPayloadRequestOptions: () => ({})
}));

const findDocMock = vi.mocked(findDoc);

const args = (collection: string | undefined, slug: string | undefined) =>
  ({
    context: {},
    params: { collection, slug },
    request: new Request('https://tenant.test/')
  }) as unknown as TypedLoaderFunctionArgs;

const caught = async (collection: string | undefined, slug?: string) => {
  try {
    await loader(args(collection, slug));
  } catch (e) {
    return e as Response;
  }
  throw new Error('Expected the loader to throw');
};

beforeEach(() => {
  vi.resetAllMocks();
});

it('returns the document tagged with its collection', async () => {
  const doc = { collection: 'posts', doc: { title: 'Hello' } };
  findDocMock.mockResolvedValue(doc as never);

  const response = await loader(args('posts', 'hello'));

  await expect(response.json()).resolves.toEqual(doc);
});

it('keeps the not-found message on the 404 it throws', async () => {
  findDocMock.mockResolvedValue(null);

  const response = await caught('posts', 'missing');

  expect(response.status).toBe(404);
  await expect(response.json()).resolves.toEqual({
    message: 'Page not found'
  });
});

it('reports an unreachable CMS as a server error, not a missing page', async () => {
  const logged = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  findDocMock.mockRejectedValue(
    new Error("Error fetching 'hello' from 'posts': cms-internal:8080 refused")
  );

  const response = await caught('posts', 'hello');

  expect(response.status).toBe(500);

  // The cause is logged for us, never serialized to the visitor
  const { message } = (await response.json()) as { message: string };
  expect(message).not.toContain('cms-internal');
  expect(logged).toHaveBeenCalledWith(
    expect.stringContaining('cms-internal:8080 refused')
  );
});

it('throws 404 without a slug', async () => {
  const response = await caught('posts', undefined);

  expect(response.status).toBe(404);
  expect(findDocMock).not.toHaveBeenCalled();
});

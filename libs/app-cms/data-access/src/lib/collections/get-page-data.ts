import type { Page } from '@codeware/shared/util/payload-types';
import type { BlocksData } from '@codeware/shared/util/payload-utils';
import type { BasePayload } from 'payload';

import { mapToRuntime } from '../map-to-runtime';
import type { PayloadRuntime } from '../payload-runtime.types';

import { getPage } from './get-page';
import { getPosts } from './get-posts';
import type { QuerySingleOptions } from './types';

export type PageData = {
  page: Page;
  blocksData: BlocksData;
};

/**
 * Fetch a page and all data required by its blocks in one call.
 *
 * `getPage` fetches the page structure. Blocks that use Payload relationship fields
 * have their data resolved automatically via `depth`. Listing blocks (e.g. PostsBlock)
 * query a collection dynamically and need a separate fetch — those are resolved here
 * and returned in `blocksData`, keyed by block id.
 *
 * Apps should call this instead of `getPage` directly so no data-fetching logic
 * leaks into route files.
 *
 * @param runtime - Authenticated Payload runtime or default Payload instance
 * @param slugOrId - Slug or ID of the page to fetch
 * @param options - Optional query options
 * @returns PageData or null if the page is not found
 */
export async function getPageData(
  runtime: PayloadRuntime | BasePayload,
  slugOrId: number | string,
  options: QuerySingleOptions = {}
): Promise<PageData | null> {
  const resolvedRuntime = mapToRuntime(runtime);

  const page = await getPage(resolvedRuntime, slugOrId, options);
  if (!page) {
    return null;
  }

  const blocksData: BlocksData = {};

  // Currently only `posts` block requires extra data, but this can be extended in the future as needed.
  const postsBlocks = page.layout?.filter((b) => b.blockType === 'posts') ?? [];

  if (postsBlocks.length) {
    const postsByBlock: NonNullable<BlocksData['posts']> = {};
    blocksData.posts = postsByBlock;
    await Promise.all(
      postsBlocks.map(async (block) => {
        if (!block.id) {
          return;
        }
        const result = await getPosts(resolvedRuntime, {
          limit: block.limit,
          sort: '-createdAt' as 'createdAt'
        });
        postsByBlock[block.id] = result?.docs ?? [];
      })
    );
  }

  return { page, blocksData };
}

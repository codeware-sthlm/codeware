import type { Page } from '@codeware/shared/util/payload-types';
import type { BlocksData } from '@codeware/shared/util/payload-utils';

import { findPosts } from './find-posts';
import type { RequestBaseOptions } from './utils/types';

/**
 * Fetch all data required by the blocks in a page layout.
 *
 * Listing blocks (e.g. PostsBlock) query a collection dynamically and need a
 * separate fetch — those are resolved here and returned in `blocksData`,
 * keyed by block id.
 *
 * @param layout - The page layout blocks to resolve data for.
 * @param options - The base request options.
 * @returns Resolved blocks data.
 */
export const getBlocksData = async (
  layout: Page['layout'] | null | undefined,
  options: RequestBaseOptions
): Promise<BlocksData> => {
  const blocksData: BlocksData = {};

  const postsBlocks = layout?.filter((b) => b.blockType === 'posts') ?? [];

  if (postsBlocks.length) {
    const postsByBlock: NonNullable<BlocksData['posts']> = {};
    blocksData.posts = postsByBlock;
    await Promise.all(
      postsBlocks.map(async (block) => {
        if (!block.id) {
          return;
        }
        const posts = await findPosts({ ...options, limit: block.limit });
        postsByBlock[block.id] = posts;
      })
    );
  }

  return blocksData;
};

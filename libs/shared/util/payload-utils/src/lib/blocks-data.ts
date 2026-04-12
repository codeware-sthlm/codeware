import type { Post } from '@codeware/shared/util/payload-types';

/**
 * Pre-fetched data keyed by block id, for blocks that require server-side data.
 *
 * Relates to collections that a block queries dynamically, without a relationship
 * field on the block itself. The block stores only query parameters (limit, filters,
 * sort etc.), not the actual documents.
 *
 * The common thread: these are collection listing blocks — the block defines how to
 * query, the data-access layer does the querying. This is different from blocks that
 * use Payload relationship fields (like ReusableContentBlock), where content is
 * resolved automatically by Payload's `depth` option.
 *
 * When adding a new listing block (e.g. `tours`), add its collection type here
 * alongside the block definition and a case in `resolveBlockProps`.
 */
export type BlocksData = {
  /** Posts data keyed by PostsBlock id */
  posts?: Record<string, Array<Post>>;
};

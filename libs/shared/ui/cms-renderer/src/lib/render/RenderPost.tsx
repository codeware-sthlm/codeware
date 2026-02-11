'use client';

import { Image } from '@codeware/shared/ui/image';
import type { Post } from '@codeware/shared/util/payload-types';

import { RichText } from '../blocks/RichText';
import { Container } from '../layout/Container';
import { usePayload } from '../providers/PayloadProvider';

type RenderPostProps = {
  /**
   * Post data to render.
   * The app is responsible for fetching this data and handling 404s.
   */
  post: Post;
};

/**
 * Format a date to a readable string
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Framework-agnostic post renderer.
 *
 * Renders a blog post with:
 * - Back button to posts listing
 * - Post title and published date
 * - Hero image (if available)
 * - Rich text content
 *
 * **Usage:**
 * The app is responsible for:
 * - Fetching post data by slug
 * - Handling 404 cases (if post is null/undefined)
 * - Providing PayloadProvider context
 *
 * @example
 * ```tsx
 * // In Next.js app
 * const post = await getPost(payload, slug);
 * if (!post) notFound();
 * return <RenderPost post={post} />;
 * ```
 */
export function RenderPost({ post }: RenderPostProps) {
  const { navigate, payloadUrl } = usePayload();

  const handleBackClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    navigate('/posts');
  };

  return (
    <Container className="mt-16 sm:mt-32">
      <div className="xl:relative">
        <div className="mx-auto max-w-2xl">
          <a
            href="/posts"
            onClick={handleBackClick}
            aria-label="Go back to articles"
            className="group mb-8 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md ring-1 shadow-zinc-800/5 ring-zinc-900/5 transition lg:absolute lg:-left-5 lg:-mt-2 lg:mb-0 xl:-top-1.5 xl:left-0 xl:mt-0 dark:border dark:border-zinc-700/50 dark:bg-zinc-800 dark:ring-0 dark:ring-white/10 dark:hover:border-zinc-700 dark:hover:ring-white/20"
          >
            <svg
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
              className="h-4 w-4 stroke-zinc-500 transition group-hover:stroke-zinc-700 dark:stroke-zinc-500 dark:group-hover:stroke-zinc-400"
            >
              <path
                d="M7.25 11.25 3.75 8m0 0 3.5-3.25M3.75 8h8.5"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
          <article>
            <header className="flex flex-col">
              <h1 className="text-core-headline mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
                {post.title}
              </h1>
              <time
                dateTime={post.publishedAt || post.createdAt}
                className="text-core-muted order-first flex items-center text-base"
              >
                <span className="h-4 w-0.5 rounded-full bg-zinc-200 dark:bg-zinc-500" />
                <span className="ml-3">
                  {formatDate(post.publishedAt || post.createdAt)}
                </span>
              </time>
            </header>
            {post.heroImage &&
              typeof post.heroImage === 'object' &&
              post.heroImage.url && (
                <div className="relative mt-8">
                  <Image
                    src={`${payloadUrl}${post.heroImage.url}`}
                    alt={post.heroImage.alt || ''}
                    width={post.heroImage.width || 1200}
                    height={post.heroImage.height || 630}
                    className="aspect-video w-full rounded-2xl bg-zinc-100 object-cover dark:bg-zinc-800"
                  />
                </div>
              )}
            <div className="prose dark:prose-invert mt-8">
              <RichText data={post.content} />
            </div>
          </article>
        </div>
      </div>
    </Container>
  );
}

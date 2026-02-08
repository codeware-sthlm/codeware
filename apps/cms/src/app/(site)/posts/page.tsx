import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getPosts } from '@codeware/app-cms/data-access';
import { Container } from '@codeware/app-cms/ui/web';
import type { Post } from '@codeware/shared/util/payload-types';

import { authenticatedPayload } from '../../../security/authenticated-payload';

/**
 * @deprecated Create an Archives block that renders a list of e.g. posts (look at Payload webpage template)
 */

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
 * Extract plain text excerpt from Lexical content
 */
function getExcerpt(post: Post, maxLength = 200): string {
  try {
    const content = post.content;
    if (!content?.root?.children) return '';

    // Extract text from all children nodes
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const extractText = (node: any): string => {
      if (typeof node.text === 'string') {
        return node.text;
      }
      if (Array.isArray(node.children)) {
        return node.children.map(extractText).join(' ');
      }
      return '';
    };

    const fullText = content.root.children.map(extractText).join(' ').trim();

    if (fullText.length <= maxLength) return fullText;

    // Truncate at word boundary
    const truncated = fullText.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    return lastSpace > 0
      ? truncated.substring(0, lastSpace) + '...'
      : truncated + '...';
  } catch {
    return '';
  }
}

export default async function Posts() {
  const payload = await authenticatedPayload();

  const result = await getPosts(payload, {
    limit: 100,
    sort: '-publishedAt' as 'publishedAt'
  });

  if (!result || !result.docs.length) {
    notFound();
  }

  const posts = result.docs;

  return (
    <Container className="mt-16 sm:mt-32">
      <header className="max-w-2xl">
        <h1 className="text-core-headline text-4xl font-bold tracking-tight sm:text-5xl">
          Writing on software design, company building, and the aerospace
          industry.
        </h1>
        <p className="text-core-muted mt-6 text-base">
          All of my long-form thoughts on programming, leadership, product
          design, and more, collected in chronological order.
        </p>
      </header>
      <div className="mt-16 sm:mt-20">
        <div className="md:border-core-border/40 space-y-16 md:border-l md:pl-6">
          {posts.map((post) => (
            <article key={post.id} className="md:grid md:grid-cols-4 md:gap-8">
              <div className="text-core-muted relative z-10 mb-3 flex items-center text-sm md:col-span-1">
                <time dateTime={post.publishedAt || post.createdAt}>
                  {formatDate(post.publishedAt || post.createdAt)}
                </time>
              </div>
              <div className="md:col-span-3">
                <h2 className="text-core-headline text-base font-semibold tracking-tight">
                  <Link
                    href={`/posts/${post.slug}`}
                    className="hover:text-core-accent group relative"
                  >
                    <span className="absolute -inset-x-4 -inset-y-6 z-0 scale-95 bg-zinc-50 opacity-0 transition group-hover:scale-100 group-hover:opacity-100 sm:-inset-x-6 sm:rounded-2xl dark:bg-zinc-800/50" />
                    <span className="relative z-10">{post.title}</span>
                  </Link>
                </h2>
                <p className="text-core-base relative z-10 mt-2 text-sm">
                  {getExcerpt(post)}
                </p>
                <div
                  aria-hidden="true"
                  className="text-core-accent relative z-10 mt-4 flex items-center text-sm font-medium"
                >
                  Read article
                  <svg
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden="true"
                    className="ml-1 h-4 w-4 stroke-current"
                  >
                    <path
                      d="M6.75 5.75 9.25 8l-2.5 2.25"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </Container>
  );
}

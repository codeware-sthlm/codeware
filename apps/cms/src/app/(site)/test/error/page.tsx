import { notFound } from 'next/navigation';

/**
 * Dev-only page that intentionally throws to trigger the global error boundary.
 *
 * Used by e2e tests to verify the maintenance page (`global-error.tsx`) renders correctly.
 * Returns 404 in production so the route is inert outside of dev/test environments.
 */
export default function TestErrorPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  throw new Error('Test error triggered intentionally by /test/error');
}

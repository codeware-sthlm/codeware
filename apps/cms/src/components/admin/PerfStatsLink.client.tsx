'use client';

import { Button } from '@codeware/shared/ui/shadcn/components/button';
import { ChartBarSquareIcon } from '@heroicons/react/24/outline';
import React from 'react';

/**
 * Toolbar shortcut to the query profiler (`admin.components.actions`).
 *
 * The profiler only exists in local development, so the server decides whether
 * to render this at all and passes the result down — a client component cannot
 * read `DEPLOY_ENV` itself.
 */
export function PerfStatsLink({ enabled }: { enabled: boolean }) {
  if (!enabled) {
    return null;
  }

  const label = 'Query profiler';

  return (
    <div className="codeware-admin twp flex items-center">
      <Button
        asChild
        variant="ghost"
        size="icon-xs"
        title={label}
        className="rounded-full"
      >
        {/* A Payload API route rendering plain HTML, not a Next page — client
            -side routing would break it. The new tab also keeps the admin page
            you are profiling open. */}
        <a href="/api/perf-stats" target="_blank" rel="noreferrer">
          <ChartBarSquareIcon className="size-3.5" />
          <span className="sr-only">{label}</span>
        </a>
      </Button>
    </div>
  );
}

export default PerfStatsLink;

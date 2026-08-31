'use client';

import type { ContrastResult } from '@codeware/shared/util/color';
import { cn } from '@codeware/shared/util/ui';
import { CheckIcon, TriangleAlertIcon } from 'lucide-react';

type ContrastReportProps = {
  scheme: string;
  results: Array<ContrastResult>;
};

/**
 * What a visitor will and will not be able to read.
 *
 * Failures first and always visible; the passes collapse behind a count, since
 * a wall of green hides the one row that matters.
 */
export function ContrastReport({ scheme, results }: ContrastReportProps) {
  const failures = results.filter(({ passes }) => !passes);
  const passed = results.length - failures.length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">{scheme}</h3>
        <span
          className={cn(
            'flex items-center gap-1.5 text-xs',
            failures.length
              ? 'text-destructive-subtle'
              : 'text-muted-foreground'
          )}
        >
          {failures.length ? (
            <>
              <TriangleAlertIcon className="size-3.5" />
              {failures.length} below WCAG AA
            </>
          ) : (
            <>
              <CheckIcon className="size-3.5" />
              {passed} pairs pass
            </>
          )}
        </span>
      </div>

      {failures.length > 0 && (
        <ul className="space-y-1">
          {failures.map(({ usage, ratio, minimum, foreground, background }) => (
            <li
              key={`${foreground}-${background}`}
              className="border-destructive/40 bg-destructive/5 rounded-md border px-2.5 py-1.5 text-xs"
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-medium">{usage}</span>
                <span className="tabular-nums">
                  {ratio.toFixed(2)}:1{' '}
                  <span className="text-muted-foreground">
                    needs {minimum}:1
                  </span>
                </span>
              </div>
              <p className="text-muted-foreground mt-0.5 font-mono text-[11px]">
                {foreground} on {background}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

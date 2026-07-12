import type React from 'react';

import type { IconComponent } from './types';

export type EmptyStateProps = {
  icon: IconComponent;
  title: string;
  description: string;
  /** Optional call to action, e.g. an outline button. */
  children?: React.ReactNode;
};

/** Centered panel placeholder when a list has nothing to show. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  children
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-1 px-4 py-8 text-center">
      <div className="bg-accent mb-1.5 flex size-10 items-center justify-center rounded-full">
        <Icon className="text-muted-foreground size-5" aria-hidden />
      </div>
      <p className="text-foreground text-sm font-medium">{title}</p>
      <p className="text-muted-foreground text-xs">{description}</p>
      {children && <div className="mt-2.5">{children}</div>}
    </div>
  );
}

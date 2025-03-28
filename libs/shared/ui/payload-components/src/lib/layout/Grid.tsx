import { cn } from '@codeware/shared/util/ui';
import React from 'react';

type Props = {
  children: React.ReactNode;
  className?: string;
  /**
   * The number of grid columns to use.
   */
  columns: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
};

/**
 * Wrapper component to dynamically define the number of grid columns.
 *
 * Useful when you can't use Tailwind classes to set a known value.
 */
export const Grid: React.FC<Props> = ({ children, className, columns }) => {
  return (
    <div
      className={cn(
        'grid',
        {
          'grid-cols-1': columns === 1,
          'grid-cols-2': columns === 2,
          'grid-cols-3': columns === 3,
          'grid-cols-4': columns === 4,
          'grid-cols-5': columns === 5,
          'grid-cols-6': columns === 6,
          'grid-cols-7': columns === 7,
          'grid-cols-8': columns === 8,
          'grid-cols-9': columns === 9,
          'grid-cols-10': columns === 10,
          'grid-cols-11': columns === 11,
          'grid-cols-12': columns === 12
        },
        className
      )}
    >
      {children}
    </div>
  );
};

import { cn } from '@codeware/shared/ui/shadcn';
import type { FieldWidth } from '@codeware/shared/util/payload-types';
import React from 'react';

type Props = {
  children: React.ReactNode;
  className?: string;
  /**
   * The number of columns the component should span.
   *
   * Defaults to full width.
   */
  columns?: FieldWidth;
};

/**
 * Wrapper component to dynamically set column span
 * for an item in a column grid layout.
 *
 * Useful when you can't use Tailwind classes to set a known value.
 *
 * Defaults to full width if no columns are provided.
 */
export const ColSpan: React.FC<Props> = ({
  children,
  className,
  columns: width
}) => {
  return (
    <div
      className={cn(
        'col-span-full',
        {
          'col-span-1': width === '1',
          'col-span-2': width === '2',
          'col-span-3': width === '3',
          'col-span-4': width === '4',
          'col-span-5': width === '5',
          'col-span-6': width === '6',
          'col-span-7': width === '7',
          'col-span-8': width === '8',
          'col-span-9': width === '9',
          'col-span-10': width === '10',
          'col-span-11': width === '11',
          'col-span-12': width === '12'
        },
        className
      )}
    >
      {children}
    </div>
  );
};

export default ColSpan;

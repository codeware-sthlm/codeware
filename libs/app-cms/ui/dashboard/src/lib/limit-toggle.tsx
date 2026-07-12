'use client';

import {
  ToggleGroup,
  ToggleGroupItem
} from '@codeware/shared/ui/shadcn/components/toggle-group';
import { cn } from '@codeware/shared/util/ui';

export type LimitToggleProps = {
  /** Accessible name describing what the options control. */
  label: string;
  options: readonly number[];
  value: number;
  onValueChange: (value: number) => void;
  className?: string;
};

/**
 * Compact segmented control for picking how many rows a panel shows.
 * All options stay visible — numeric labels keep it narrow.
 */
export function LimitToggle({
  label,
  options,
  value,
  onValueChange,
  className
}: LimitToggleProps) {
  return (
    <ToggleGroup
      type="single"
      value={String(value)}
      onValueChange={(next) => {
        // Ignore deselection — one option is always active
        if (next) onValueChange(Number(next));
      }}
      aria-label={label}
      className={cn('bg-muted rounded-lg p-0.5', className)}
    >
      {options.map((option) => (
        <ToggleGroupItem
          key={option}
          value={String(option)}
          className="text-muted-foreground hover:text-foreground data-[state=on]:bg-background data-[state=on]:text-foreground h-6 min-w-8 rounded-md px-2 text-xs hover:bg-transparent data-[state=on]:shadow-sm"
        >
          {option}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

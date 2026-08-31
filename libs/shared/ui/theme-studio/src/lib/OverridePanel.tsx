'use client';

import { isValidTokenValue } from '@codeware/shared/theme';
import { Button } from '@codeware/shared/ui/shadcn/components/button';
import { Input } from '@codeware/shared/ui/shadcn/components/input';
import { ScrollArea } from '@codeware/shared/ui/shadcn/components/scroll-area';
import {
  Tabs,
  TabsList,
  TabsTrigger
} from '@codeware/shared/ui/shadcn/components/tabs';
import type { ThemeTokens } from '@codeware/shared/util/color';
import { cn } from '@codeware/shared/util/ui';
import { RotateCcwIcon } from 'lucide-react';
import { useState } from 'react';

export type ThemeOverrides = { light: ThemeTokens; dark: ThemeTokens };

/**
 * Record one hand-edit, keeping the override set as small as it can be.
 *
 * An edit back to the generated value is a removal, not a store: leaving it in
 * would silently pin the token, and a later change of brand or base would skip
 * it for no reason the author could see. Clearing the field does the same.
 */
export function applyTokenEdit(
  overrides: ThemeOverrides,
  generated: ThemeOverrides,
  scheme: 'light' | 'dark',
  name: string,
  value: string
): ThemeOverrides {
  const next = { ...overrides[scheme] };

  if (value === '' || value === generated[scheme][name]) {
    delete next[name];
  } else {
    next[name] = value;
  }

  return { ...overrides, [scheme]: next };
}

type OverridePanelProps = {
  /** What the recipe produced, before overrides */
  generated: ThemeOverrides;
  overrides: ThemeOverrides;
  onChange: (overrides: ThemeOverrides) => void;
};

/**
 * Edit single tokens the recipe cannot express.
 *
 * The escape hatch, not the main road: four decisions cover a whole theme, and
 * anything set here stops following the recipe, so a later change of brand or
 * base leaves it behind. Overridden rows say so.
 *
 * Only the light scheme lists every token — dark carries just what it changes,
 * and adding a token there that light already covers would be a no-op the
 * cascade throws away.
 */
export function OverridePanel({
  generated,
  overrides,
  onChange
}: OverridePanelProps) {
  const [scheme, setScheme] = useState<'light' | 'dark'>('light');
  const [filter, setFilter] = useState('');

  const names = Object.keys(generated[scheme]).filter((name) =>
    name.includes(filter.trim())
  );

  const setToken = (name: string, value: string) =>
    onChange(applyTokenEdit(overrides, generated, scheme, name, value));

  const overriddenCount = Object.keys(overrides[scheme]).length;

  return (
    <div className="flex h-full flex-col gap-3">
      <Tabs
        value={scheme}
        onValueChange={(value) => setScheme(value as 'light' | 'dark')}
      >
        <TabsList className="w-full">
          <TabsTrigger value="light" className="flex-1">
            Light
          </TabsTrigger>
          <TabsTrigger value="dark" className="flex-1">
            Dark
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex items-center gap-2">
        <Input
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          placeholder="Filter tokens"
          className="h-8 text-xs"
        />
        {overriddenCount > 0 && (
          <Button
            size="sm"
            variant="ghost"
            className="shrink-0"
            onClick={() => onChange({ ...overrides, [scheme]: {} })}
          >
            Reset {overriddenCount}
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-1 pr-3">
          {names.map((name) => {
            const overridden = name in overrides[scheme];
            const value = overridden
              ? overrides[scheme][name]
              : generated[scheme][name];
            const invalid = overridden && !isValidTokenValue(value);

            return (
              <div key={name} className="flex items-center gap-2">
                <code
                  className={cn(
                    'w-44 shrink-0 truncate text-[11px]',
                    overridden
                      ? 'text-foreground font-medium'
                      : 'text-muted-foreground'
                  )}
                  title={name}
                >
                  {name}
                </code>
                <Input
                  value={value}
                  onChange={(event) => setToken(name, event.target.value)}
                  aria-label={name}
                  aria-invalid={invalid}
                  className={cn(
                    'h-7 font-mono text-[11px]',
                    invalid && 'border-destructive'
                  )}
                />
                <span
                  className="border-border size-5 shrink-0 rounded border"
                  style={{ background: value }}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-6 shrink-0"
                  disabled={!overridden}
                  aria-label={`Reset ${name}`}
                  onClick={() => setToken(name, '')}
                >
                  <RotateCcwIcon className="size-3" />
                </Button>
              </div>
            );
          })}

          {names.length === 0 && (
            <p className="text-muted-foreground py-4 text-center text-xs">
              No token matches “{filter}”.
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

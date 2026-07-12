'use client';

import { MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import type { Theme } from '@payloadcms/ui';
import { useTheme, useTranslation } from '@payloadcms/ui';
import React from 'react';

import type {
  TranslationsKeys,
  TranslationsObject
} from '@codeware/app-cms/util/i18n';
import { Button } from '@codeware/shared/ui/shadcn/components/button';
import { cn } from '@codeware/shared/util/ui';

/**
 * Compact light/dark pill for Payload's toolbar (`admin.components.actions`),
 * giving editors one-click access to the theme instead of digging into the
 * account page. Persistence comes from Payload's own `useTheme` provider.
 */
export function ThemeSwitch() {
  const { setTheme, theme } = useTheme();
  const { t } = useTranslation<TranslationsObject, TranslationsKeys>();

  const options: { value: Theme; icon: typeof SunIcon; label: string }[] = [
    { value: 'light', icon: SunIcon, label: t('nav:themeLight') },
    { value: 'dark', icon: MoonIcon, label: t('nav:themeDark') }
  ];

  return (
    <div className="codeware-admin twp border-border bg-background flex items-center gap-0.5 rounded-full border p-0.5">
      {options.map(({ value, icon: Icon, label }) => {
        const active = theme === value;
        return (
          <Button
            key={value}
            onClick={() => setTheme(value)}
            variant="ghost"
            size="icon-xs"
            aria-pressed={active}
            title={label}
            className={cn(
              'rounded-full',
              active
                ? 'bg-accent text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="size-3.5" />
            <span className="sr-only">{label}</span>
          </Button>
        );
      })}
    </div>
  );
}

export default ThemeSwitch;

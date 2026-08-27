'use client';

import type {
  TranslationsKeys,
  TranslationsObject
} from '@codeware/app-cms/util/i18n';
import { Button } from '@codeware/shared/ui/shadcn/components/button';
import { cn } from '@codeware/shared/util/ui';
import {
  ComputerDesktopIcon,
  MoonIcon,
  SunIcon
} from '@heroicons/react/24/outline';
import type { Theme } from '@payloadcms/ui';
import { useTheme, useTranslation } from '@payloadcms/ui';
import React from 'react';

type ColorSchemeOption = Theme | 'auto';

/**
 * Compact system/light/dark pill for Payload's toolbar
 * (`admin.components.actions`), giving editors one-click access to the color
 * scheme instead of digging into the account page. Persistence comes from
 * Payload's own `useTheme` provider, whose `Theme` type is light/dark.
 *
 * `auto` follows the operating system preference and is the state until an
 * explicit choice is made — Payload resolves it to light unless the OS asks
 * for dark.
 */
export function ColorSchemeSwitch() {
  const { autoMode, setTheme: setColorScheme, theme: colorScheme } = useTheme();
  const { t } = useTranslation<TranslationsObject, TranslationsKeys>();

  const options: {
    value: ColorSchemeOption;
    icon: typeof SunIcon;
    label: string;
  }[] = [
    {
      value: 'auto',
      icon: ComputerDesktopIcon,
      label: t('nav:colorSchemeAuto')
    },
    { value: 'light', icon: SunIcon, label: t('nav:colorSchemeLight') },
    { value: 'dark', icon: MoonIcon, label: t('nav:colorSchemeDark') }
  ];

  const current: ColorSchemeOption = autoMode ? 'auto' : colorScheme;

  return (
    <div className="codeware-admin twp border-border bg-background flex items-center gap-0.5 rounded-full border p-0.5">
      {options.map(({ value, icon: Icon, label }) => {
        const active = current === value;
        return (
          <Button
            key={value}
            // `auto` is handled by the provider but missing from its types,
            // just like Payload's own account page toggle
            onClick={() => setColorScheme(value as Theme)}
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

export default ColorSchemeSwitch;

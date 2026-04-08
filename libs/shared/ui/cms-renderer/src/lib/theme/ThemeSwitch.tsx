'use client';

import { t } from '@codeware/shared/util/i18n';
import { cn } from '@codeware/shared/util/ui';
import { MonitorIcon, MoonStarIcon, SunIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { usePayload } from '../providers/PayloadProvider';

/**
 * Render the icon with color transitions for the current theme.
 */
function getThemeIcon(
  theme: 'light' | 'dark' | 'system' | undefined
): React.ReactElement {
  let Icon;
  if (theme === 'system') {
    Icon = MonitorIcon;
  } else if (theme === 'dark') {
    Icon = MoonStarIcon;
  } else {
    Icon = SunIcon;
  }

  return (
    <Icon
      className={cn(
        'stroke-core-action-btn-foreground fill-core-action-btn-icon-fill group-hover:stroke-core-action-btn-foreground-hover size-6 stroke-[1.5] transition'
      )}
    />
  );
}

/**
 * Theme switch component that cycles through light, dark, and system themes.
 * Uses PayloadProvider for theme state and updates.
 */
export function ThemeSwitch() {
  const { theme, setTheme, locale } = usePayload();
  const [mounted, setMounted] = useState(false);

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  // Cycle through: light -> dark -> system -> light
  const getNextTheme = (
    current: 'light' | 'dark' | 'system' | undefined
  ): 'light' | 'dark' | 'system' => {
    if (current === 'light') return 'dark';
    if (current === 'dark') return 'system';
    return 'light';
  };

  const currentTheme = theme ?? 'light';
  const nextTheme = getNextTheme(currentTheme);
  const icon = getThemeIcon(currentTheme);

  const getThemeLabel = (theme: 'light' | 'dark' | 'system'): string => {
    if (theme === 'system') return t(locale, 'theme.system');
    if (theme === 'dark') return t(locale, 'theme.dark');
    return t(locale, 'theme.light');
  };

  return (
    <button
      type="button"
      onClick={() => setTheme(nextTheme)}
      className="group bg-core-action-btn-background shadow-core-action-btn-shadow ring-core-action-btn-border hover:ring-core-action-btn-border-hover rounded-full px-3 py-2 shadow-lg ring-1 backdrop-blur transition"
      aria-label={t(locale, 'theme.switchTo', {
        theme: getThemeLabel(nextTheme)
      })}
      title={t(locale, 'theme.currentClickFor', {
        current: getThemeLabel(currentTheme),
        next: getThemeLabel(nextTheme)
      })}
    >
      {icon}
      <span className="sr-only capitalize">{getThemeLabel(currentTheme)}</span>
    </button>
  );
}

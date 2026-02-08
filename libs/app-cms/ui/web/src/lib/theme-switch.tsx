'use client';

import { cn } from '@codeware/shared/util/ui';
import { MonitorIcon, MoonStarIcon, SunIcon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export type ThemeMode = 'system' | 'light' | 'dark';

/**
 * Render the icon with color transitions for the current theme mode.
 *
 * **A note about the user preferred theme feature**
 *
 * The icon gets the brand color when the user has selected a theme that isn't what the user actually prefers from its settings.
 * For example user prefers light mode but has selected dark mode.
 */
function getThemeIcon(mode: ThemeMode): React.ReactElement {
  const Icon =
    mode === 'light' ? SunIcon : mode === 'dark' ? MoonStarIcon : MonitorIcon;

  return (
    <Icon
      className={cn(
        'stroke-core-action-btn-foreground fill-core-action-btn-icon-fill group-hover:stroke-core-action-btn-foreground-hover size-6 stroke-[1.5] transition',
        {
          '[@media(prefers-color-scheme:dark)]:fill-brand-200 [@media(prefers-color-scheme:dark)]:stroke-brand-500':
            mode === 'light',
          '[@media_not_(prefers-color-scheme:dark)]:fill-brand-300 [@media_not_(prefers-color-scheme:dark)]:stroke-brand-500':
            mode === 'dark'
        }
      )}
    />
  );
}

export function ThemeSwitch() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const mode = (theme ?? 'system') as ThemeMode;
  const nextMode: ThemeMode =
    mode === 'system' ? 'light' : mode === 'light' ? 'dark' : 'system';
  const icon = getThemeIcon(mode);

  return (
    <button
      type="button"
      onClick={() => setTheme(nextMode)}
      className="group bg-core-action-btn-background shadow-core-action-btn-shadow ring-core-action-btn-border hover:ring-core-action-btn-border-hover rounded-full px-3 py-2 shadow-lg ring-1 backdrop-blur transition"
      aria-label={`Switch to ${nextMode} theme`}
      title={`Current: ${mode}, click for ${nextMode}`}
    >
      {icon}
      <span className="sr-only capitalize">{mode}</span>
    </button>
  );
}

'use client';

import { cn } from '@codeware/shared/util/ui';
import { MoonStarIcon, SunIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { usePayload } from '../providers/PayloadProvider';

/**
 * Render the icon with color transitions for the current theme.
 */
function getThemeIcon(theme: 'light' | 'dark' | undefined): React.ReactElement {
  const Icon = theme === 'dark' ? MoonStarIcon : SunIcon;

  return (
    <Icon
      className={cn(
        'stroke-core-action-btn-foreground fill-core-action-btn-icon-fill group-hover:stroke-core-action-btn-foreground-hover size-6 stroke-[1.5] transition'
      )}
    />
  );
}

/**
 * Theme switch component that toggles between light and dark themes.
 * Uses PayloadProvider for theme state and updates.
 */
export function ThemeSwitch() {
  const { theme, setTheme } = usePayload();
  const [mounted, setMounted] = useState(false);

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const nextTheme = theme === 'dark' ? 'light' : 'dark';
  const icon = getThemeIcon(theme);

  return (
    <button
      type="button"
      onClick={() => setTheme(nextTheme)}
      className="group bg-core-action-btn-background shadow-core-action-btn-shadow ring-core-action-btn-border hover:ring-core-action-btn-border-hover rounded-full px-3 py-2 shadow-lg ring-1 backdrop-blur transition"
      aria-label={`Switch to ${nextTheme} theme`}
      title={`Current: ${theme ?? 'light'}, click for ${nextTheme}`}
    >
      {icon}
      <span className="sr-only capitalize">{theme ?? 'light'}</span>
    </button>
  );
}

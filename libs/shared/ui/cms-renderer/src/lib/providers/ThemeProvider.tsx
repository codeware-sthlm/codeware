'use client';

import type { ReactNode } from 'react';

import { usePayload } from './PayloadProvider';

type ThemeProviderProps = {
  children: ReactNode;
};

/**
 * Framework-agnostic theme provider that applies theme classes.
 * The actual theme state management is handled by the app's PayloadProvider implementation.
 *
 * This component applies the resolved theme class to enable CSS variables for theming.
 * Note: If using next-themes, this is redundant as NextThemesProvider handles class application.
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const { resolvedTheme } = usePayload();

  return (
    <div className={resolvedTheme} style={{ display: 'contents' }}>
      {children}
    </div>
  );
}

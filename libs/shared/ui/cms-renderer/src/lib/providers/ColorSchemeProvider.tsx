'use client';

import type { ReactNode } from 'react';

import { usePayload } from './PayloadProvider';

type ColorSchemeProviderProps = {
  children: ReactNode;
};

/**
 * Framework-agnostic color scheme provider that applies the light/dark class.
 * The actual state management is handled by the app's PayloadProvider implementation.
 *
 * This component applies the resolved color scheme class to enable CSS variables.
 * Note: If using next-themes, this is redundant as NextThemesProvider handles class application.
 */
export function ColorSchemeProvider({ children }: ColorSchemeProviderProps) {
  const { resolvedColorScheme } = usePayload();

  return (
    <div className={resolvedColorScheme} style={{ display: 'contents' }}>
      {children}
    </div>
  );
}

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
 * This component applies the theme class to enable CSS variables for theming.
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const { theme } = usePayload();

  return (
    <div className={theme} style={{ display: 'contents' }}>
      {children}
    </div>
  );
}

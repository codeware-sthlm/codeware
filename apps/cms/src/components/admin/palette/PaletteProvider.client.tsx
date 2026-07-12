'use client';

import { useAuth } from '@payloadcms/ui';
import React, { useContext, useEffect, useMemo, useState } from 'react';

import type { User } from '@codeware/shared/util/payload-types';

type PaletteContextValue = {
  /** Whether the palette is currently open. */
  open: boolean;
  /** Open the palette. */
  openPalette: () => void;
  /** Set the open state of the palette. */
  setOpen: (open: boolean) => void;
};

const PaletteContext = React.createContext<PaletteContextValue>({
  open: false,
  openPalette: () => undefined,
  setOpen: () => undefined
});

/** Open the globally mounted command palette from anywhere in the admin. */
export const usePalette = () => useContext(PaletteContext);

// ── provider ──────────────────────────────────────────────────────────────────

/**
 * Globally mounted palette provider (`admin.components.providers`).
 *
 * Owns the ⌘K / Ctrl+K shortcut and the palette's open state for the whole
 * admin. Login and other unauthenticated views get children only.
 *
 * The dialog itself is mounted by `PaletteTrigger` (an `admin.components.
 * actions` entry) — actions render inside Payload's default template where
 * per-user contexts like entity visibility exist; this provider mounts above
 * them and only owns the shortcut and the open state.
 */
export function PaletteProvider({ children }: { children?: React.ReactNode }) {
  const { user } = useAuth<User>();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      return;
    }

    // Listen for ⌘K / Ctrl+K to toggle the palette open state.
    // The palette itself is mounted by `PaletteTrigger` in the admin actions slot.
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((previous) => !previous);
      }
    };
    document.addEventListener('keydown', onKeyDown);

    // Cleanup on unmount or user change
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [user]);

  // Memoize the context value to avoid unnecessary re-renders of consumers
  const context = useMemo<PaletteContextValue>(
    () => ({ open, openPalette: () => setOpen(true), setOpen }),
    [open]
  );

  return (
    <PaletteContext.Provider value={context}>
      {children}
    </PaletteContext.Provider>
  );
}

export default PaletteProvider;

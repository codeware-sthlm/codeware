'use client';

import { usePreferences } from '@payloadcms/ui';
import { useCallback, useEffect, useState } from 'react';

import type { CollectionSlug } from '@codeware/shared/util/payload-types';

export type RecentEntry = {
  id: string;
  collectionSlug: CollectionSlug;
  title: string;
};

type PalettePreferences = {
  recent?: RecentEntry[];
};

const PREFERENCES_KEY = 'admin-palette';
const RECENT_LIMIT = 8;

/**
 * Most-recently-used documents for the command palette, backed by the user's
 * stored admin preferences.
 *
 * Hydrates when the palette opens and exposes `recordRecent` to prepend a
 * document (de-duplicated, capped at {@link RECENT_LIMIT}) and persist it.
 *
 * @param open - Whether the palette is open; hydration only runs while open.
 * @returns The recent list and a `recordRecent` writer.
 */
export function useRecentDocuments(open: boolean): {
  recent: RecentEntry[];
  recordRecent: (entry: RecentEntry) => void;
} {
  const { getPreference, setPreference } = usePreferences();
  const [recent, setRecent] = useState<RecentEntry[]>([]);

  // Hydrate recent documents from the user's stored admin preferences
  useEffect(() => {
    if (!open) {
      return;
    }
    let cancelled = false;
    getPreference<PalettePreferences>(PREFERENCES_KEY)
      .then((preferences) => {
        if (cancelled || !Array.isArray(preferences?.recent)) {
          return;
        }
        setRecent(preferences.recent.slice(0, RECENT_LIMIT));
      })
      .catch(() => undefined);

    return () => {
      // Prevents state updates if the dialog closes before the async preference load completes
      cancelled = true;
    };
  }, [open, getPreference]);

  /** Record a document in the recent list and persist it to the user's admin preferences. */
  const recordRecent = useCallback(
    (entry: RecentEntry) => {
      setRecent((previous) => {
        const next = [
          entry,
          ...previous.filter(
            (item) =>
              item.id !== entry.id ||
              item.collectionSlug !== entry.collectionSlug
          )
        ].slice(0, RECENT_LIMIT);
        void setPreference<PalettePreferences>(
          PREFERENCES_KEY,
          { recent: next },
          true
        );
        return next;
      });
    },
    [setPreference]
  );

  return { recent, recordRecent };
}

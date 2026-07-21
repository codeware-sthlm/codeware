'use client';

import { useConfig } from '@payloadcms/ui';
import { useEffect, useRef, useState } from 'react';

import type {
  PaletteSearchResponse,
  PaletteSearchResultItem
} from '@codeware/shared/util/payload-types';

const DEBOUNCE_MS = 250;

/** Mirrors the endpoint's minimum — shorter queries never leave the client */
export const MIN_QUERY_LENGTH = 2;

export type PaletteSearchStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * Debounced document search against the `palette-search` endpoint.
 *
 * Previous results are kept while a new search is in flight to avoid list
 * flicker. Stale responses are discarded twice over: in-flight requests are
 * aborted when superseded, and responses echoing an outdated query are
 * ignored.
 */
export function usePaletteSearch(query: string): {
  status: PaletteSearchStatus;
  results: Array<PaletteSearchResultItem>;
} {
  const { config } = useConfig();
  const apiRoute = config.routes.api;

  const trimmed = query.trim();
  const enabled = trimmed.length >= MIN_QUERY_LENGTH;

  const [status, setStatus] = useState<PaletteSearchStatus>('idle');
  const [results, setResults] = useState<Array<PaletteSearchResultItem>>([]);
  const abortRef = useRef<AbortController | null>(null);
  const queryRef = useRef(query);

  useEffect(() => {
    queryRef.current = query;

    // Short queries never leave the client — the idle/empty result is derived
    // below rather than stored, so no state update is needed here.
    if (!enabled) {
      abortRef.current?.abort();
      return;
    }

    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setStatus('loading');

      try {
        const response = await fetch(
          `${apiRoute}/palette-search?q=${encodeURIComponent(trimmed)}`,
          { credentials: 'same-origin', signal: controller.signal }
        );
        if (!response.ok) {
          setStatus('error');
          return;
        }
        const data = (await response.json()) as PaletteSearchResponse;
        if (data.query !== queryRef.current.trim()) return;
        setResults(data.results);
        setStatus('success');
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
        setStatus('error');
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query, trimmed, enabled, apiRoute]);

  // Abort any in-flight request on unmount
  useEffect(() => () => abortRef.current?.abort(), []);

  // While the query is too short the search is inactive: report idle with no
  // results without persisting that derived state.
  return enabled ? { status, results } : { status: 'idle', results: [] };
}

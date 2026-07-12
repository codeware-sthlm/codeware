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
  const [status, setStatus] = useState<PaletteSearchStatus>('idle');
  const [results, setResults] = useState<Array<PaletteSearchResultItem>>([]);
  const abortRef = useRef<AbortController | null>(null);
  const queryRef = useRef(query);
  queryRef.current = query;

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      abortRef.current?.abort();
      setStatus('idle');
      setResults([]);
      return;
    }

    setStatus('loading');
    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

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
  }, [query, apiRoute]);

  // Abort any in-flight request on unmount
  useEffect(() => () => abortRef.current?.abort(), []);

  return { status, results };
}

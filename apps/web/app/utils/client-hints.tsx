/**
 * This file contains utilities for using client hints for user preference which
 * are needed by the server, but are only known by the browser.
 */
import { getHintUtils } from '@epic-web/client-hints';
import {
  clientHint as colourSchemeHint,
  subscribeToSchemeChange
} from '@epic-web/client-hints/color-scheme';
import { useRevalidator } from '@remix-run/react';
import * as React from 'react';

import { useRequestInfo } from './request-info';

const hintsUtils = getHintUtils({ theme: colourSchemeHint });

export const { getHints } = hintsUtils;

/**
 * Hook to get the client hints from the request info
 *
 * @returns an object with the client hints and their values
 */
export function useHints() {
  const requestInfo = useRequestInfo();
  return requestInfo.hints;
}

/**
 * Client hint check script
 *
 * @returns inline script element that checks for client hints and sets cookies
 * if they are not set then reloads the page if any cookie was set to an
 * inaccurate value.
 */
export function ClientHintCheck() {
  const { revalidate } = useRevalidator();
  // Subscribe to colour scheme preference changes to revalidate the page
  React.useEffect(
    () => subscribeToSchemeChange(() => revalidate()),
    [revalidate]
  );

  return (
    <script
      dangerouslySetInnerHTML={{
        __html: hintsUtils.getClientHintCheckScript()
      }}
    />
  );
}

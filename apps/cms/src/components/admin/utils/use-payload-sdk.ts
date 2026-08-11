'use client';

import type { Config, User } from '@codeware/shared/util/payload-types';
import { PayloadSDK } from '@payloadcms/sdk';
import { useAuth, useConfig } from '@payloadcms/ui';
import { useMemo } from 'react';

/**
 * Authenticated Payload SDK for a custom admin view, plus the api route it was
 * built from — a CSV export is a plain download link, so it needs the same
 * base without going through the SDK.
 */
export function usePayloadSdk(): {
  sdk: PayloadSDK<Config>;
  apiRoute: string;
} {
  const { token } = useAuth<User>();
  const { config } = useConfig();
  const apiRoute = `${config.serverURL ?? ''}${config.routes.api}`;

  const sdk = useMemo(
    () =>
      new PayloadSDK<Config>({
        baseURL: apiRoute,
        baseInit: token ? { headers: { Authorization: `JWT ${token}` } } : {}
      }),
    [apiRoute, token]
  );

  return { sdk, apiRoute };
}

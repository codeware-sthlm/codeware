import { headers } from 'next/headers';
import type { ServerProps } from 'payload';
import React from 'react';

import { DomainMismatchNoticeClient } from './DomainMismatchNotice.client';

/**
 * Warn when the admin is reached on a host this deployment refuses cookies from.
 *
 * `extractJWT` drops the session cookie for any origin outside `config.csrf`,
 * which leaves the admin rendering as though logged out — collections hidden by
 * their `admin.hidden` role check, an editor's role in the sidebar, and a logout
 * that cannot complete. Nothing in the UI says why, so this does.
 *
 * Server-side on purpose: adoption assigns `serverURL` in `onInit`, after the
 * client config has been derived, so the value the browser receives is the
 * boot-time one and cannot be compared against the address bar.
 */
const DomainMismatchNotice: React.FC<ServerProps> = async ({ payload }) => {
  if (!payload) {
    return null;
  }

  const headerList = await headers();
  const host = headerList.get('host');

  if (!host) {
    return null;
  }

  const { config } = payload;
  const protocol = headerList.get('x-forwarded-proto') ?? 'https';
  const origin = `${protocol}://${host}`;

  const trusted = new Set(
    [config.serverURL, ...(config.csrf ?? [])].filter(Boolean)
  );

  if (trusted.has(origin)) {
    return null;
  }

  return (
    <DomainMismatchNoticeClient origin={origin} expected={config.serverURL} />
  );
};

export default DomainMismatchNotice;

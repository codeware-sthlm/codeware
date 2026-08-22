import { hasNoAdminRoles } from '@codeware/app-cms/util/misc';
import type { UIFieldServerComponent } from 'payload';
import React from 'react';

import { getTenantWhere } from '../utils/tenant-where';

import { FormNotificationRecipient } from './FormNotificationRecipient.client';

/**
 * Resolves the tenant's generic notification recipient once, server-side,
 * and hands it to the client half — which decides *whether* to show it,
 * reactively, as the editor fills in the form's own `emailTo` fields.
 *
 * The tenant setting lives in a separate document (site settings), so a page
 * load is the right granularity for reading it: no client fetch, no new
 * endpoint. Only the decision of when to surface it needs to be reactive.
 */
const FormNotificationRecipientField: UIFieldServerComponent = async ({
  payload,
  user
}) => {
  const tenantWhere = await getTenantWhere(user);

  const { docs } = await payload.find({
    collection: 'site-settings',
    where: tenantWhere ?? {},
    depth: 0,
    limit: 1,
    overrideAccess: false,
    user: user ?? undefined,
    disableErrors: true
  });

  const settings = docs[0];
  const recipients = (settings?.forms?.notificationRecipients ?? [])
    .map((entry) => entry.email)
    .filter(Boolean);

  const adminRoute = payload.config.routes?.admin ?? '/admin';
  // Site settings is one document per workspace, so the useful link is that
  // document — the collection route has no list to land on and 404s
  const settingsHref = settings
    ? `${adminRoute}/collections/site-settings/${settings.id}`
    : `${adminRoute}/collections/site-settings`;
  // Same rule `LegalPagesStatus` uses: a plain tenant user can read this
  // document but never save it, so a link here would only lead to a dead end
  const canEditSettings = !hasNoAdminRoles(user ?? null);

  return (
    <FormNotificationRecipient
      recipients={recipients}
      settingsHref={canEditSettings ? settingsHref : null}
    />
  );
};

export default FormNotificationRecipientField;

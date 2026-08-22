import { getId, hasNoAdminRoles } from '@codeware/app-cms/util/misc';
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
 *
 * Scoped by the *form's own* tenant, not the admin's currently selected
 * workspace: a system-user who opens a form without having switched their
 * nav to its tenant has no tenant cookie set, and `getTenantWhere` answers
 * that with `undefined` rather than the form's actual tenant. Falls back to
 * the session-based lookup only for a brand new, unsaved form that has no
 * tenant yet — but when even that comes back empty, there is no reliable
 * scope to query with, and an unscoped `where: {}` would show whichever
 * tenant's site settings happen to sort first: actively wrong, not merely
 * empty. Rendering nothing is the honest answer in that case.
 */
const FormNotificationRecipientField: UIFieldServerComponent = async ({
  data,
  payload,
  user
}) => {
  const formTenantId = getId(data?.['tenant']);
  const tenantWhere = formTenantId
    ? { tenant: { equals: formTenantId } }
    : await getTenantWhere(user);

  if (!tenantWhere) {
    return null;
  }

  const { docs } = await payload.find({
    collection: 'site-settings',
    where: tenantWhere,
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

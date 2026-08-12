import { mapToRuntime } from '@codeware/app-cms/data-access';
import { customT } from '@codeware/app-cms/util/i18n';
import type { Page } from '@codeware/shared/util/payload-types';
import type { I18nClient } from '@payloadcms/translations';
import Link from 'next/link';
import type { Payload, TypedUser } from 'payload';
import React from 'react';

import { getTenantWhere } from '../utils/tenant-where';

type Props = {
  i18n: I18nClient;
  payload: Payload;
  user: TypedUser | null | undefined;
};

/** A configured page is only doing its job once it is published */
const describe = (
  page: unknown
): { title: string; published: boolean } | null =>
  page && typeof page === 'object'
    ? {
        title: (page as Page).name ?? '',
        published: (page as Page)._status === 'published'
      }
    : null;

/**
 * Whether this workspace has the pages a signup form must link to.
 *
 * Shown next to the signup list because that is where the editor thinks about
 * signups — the settings themselves live elsewhere, and a privacy page that
 * was never published is invisible from here otherwise. It is the one part of
 * the signup flow that is configured once and then easy to forget.
 */
export const LegalPagesStatus: React.FC<Props> = async ({
  i18n,
  payload,
  user
}) => {
  const t = customT(i18n.t);
  const runtime = mapToRuntime(payload, user ?? null);
  const tenantWhere = await getTenantWhere(user);

  const { docs } = await runtime.payload.find({
    collection: 'site-settings',
    where: tenantWhere ?? {},
    depth: 1,
    limit: 1,
    overrideAccess: false,
    user: user ?? undefined,
    disableErrors: true
  });

  const settings = docs[0];
  const privacy = describe(settings?.tourSignups?.privacyPage);
  const terms = describe(settings?.tourSignups?.termsPage);

  const adminRoute = payload.config.routes?.admin ?? '/admin';
  // Site settings is one document per workspace, so the useful link is that
  // document — the collection route has no list to land on and 404s
  const settingsHref = settings
    ? `${adminRoute}/collections/site-settings/${settings.id}`
    : `${adminRoute}/collections/site-settings`;

  const line = (label: string, page: ReturnType<typeof describe>) => (
    <span className="flex items-center gap-1.5">
      <span className="text-muted-foreground">{label}:</span>
      {page ? (
        <>
          <span>{page.title}</span>
          {!page.published && (
            <span className="text-(--destructive-subtle)">
              ({t('tourSignups:legalDraft')})
            </span>
          )}
        </>
      ) : (
        <span className="text-(--destructive-subtle)">
          {t('tourSignups:legalMissing')}
        </span>
      )}
    </span>
  );

  return (
    <div className="codeware-admin twp border-border text-muted-foreground mb-6 flex flex-wrap items-center gap-x-6 gap-y-1 rounded-lg border px-3 py-2 text-sm">
      {line(t('tourSignups:privacyPage'), privacy)}
      {line(t('tourSignups:termsPage'), terms)}
      <Link className="underline" href={settingsHref} prefetch={false}>
        {t('tourSignups:legalSettingsLink')}
      </Link>
    </div>
  );
};

export default LegalPagesStatus;

'use client';

import {
  IntegrationRow,
  type PlatformData,
  StatusWidget,
  summarizeBuild,
  summarizeIntegrations
} from '@codeware/app-cms/ui/dashboard';
import {
  DomainStatusRow,
  byWorstFirst,
  summarizeDomains
} from '@codeware/app-cms/ui/domains';
import type {
  TranslationsKeys,
  TranslationsObject
} from '@codeware/app-cms/util/i18n';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@codeware/shared/ui/shadcn/components/sheet';
import {
  CubeIcon,
  PuzzlePieceIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { useTranslation } from '@payloadcms/ui';
import Link from 'next/link';
import { useState } from 'react';

/** Which detail sheet is open, if any */
type OpenSheet = 'domains' | 'integrations' | null;

/**
 * Dashboard Platform tab: cross-tenant status for whoever runs the platform.
 *
 * Built for the answer being "everything is fine" almost every time — the
 * icons carry the verdict, so a healthy panel is taken in at a glance and only
 * a widget that has something to say asks to be read.
 *
 * Scope is deliberately the opposite of the Home tab's: every workspace plus
 * the platform itself, ignoring the workspace selector entirely.
 */
export function PlatformTab({ data }: { data: PlatformData }) {
  const { t } = useTranslation<TranslationsObject, TranslationsKeys>();
  const [openSheet, setOpenSheet] = useState<OpenSheet>(null);

  const domains = summarizeDomains(data.domains);
  const integrations = summarizeIntegrations(data.integrations);
  const build = summarizeBuild(data.build);

  const domainsDetail = (() => {
    switch (domains.kind) {
      case 'none':
        return t('platform:domainsNone');
      case 'all-active':
        return t('platform:summaryAllActive');
      case 'paused':
        return t('platform:summaryPaused', { count: domains.count });
      case 'issues':
        return t('platform:summaryIssues', { count: domains.count });
      case 'not-requested':
        return t('platform:summaryNotRequested', { count: domains.count });
      case 'expiring':
        return t('platform:summaryExpiring', { count: domains.count });
      case 'pending':
        return t('platform:summaryPending', { count: domains.count });
    }
  })();

  const integrationsDetail = (() => {
    switch (integrations.kind) {
      case 'not-production':
        return t('platform:integrationsNotProduction');
      case 'email-missing':
        return t('platform:integrationsEmailMissing');
      case 'email-not-delivered':
        return t('platform:integrationsEmailNotDelivered');
      case 'incomplete':
        return t('platform:integrationsIncomplete', {
          count: integrations.count
        });
      case 'all-configured':
        return t('platform:integrationsAllConfigured');
    }
  })();

  const configured = [
    data.integrations.email,
    data.integrations.sentryOrg,
    data.integrations.storageBucket,
    data.integrations.infisicalAuth
  ];

  const rowLabels = {
    active: t('domains:active'),
    pending: t('domains:pending'),
    notRequested: t('domains:notRequested'),
    paused: t('domains:paused'),
    hasIssues: t('domains:hasIssues'),
    neverChecked: t('domains:neverChecked')
  };

  const integrationRows = [
    {
      label: t('platform:labelEmail'),
      provider: data.integrations.email,
      value: data.integrations.emailHost
    },
    {
      label: t('platform:labelSentry'),
      provider: data.integrations.sentryOrg ? 'sentry' : null,
      value: data.integrations.sentryOrg
    },
    {
      // Bucket first: "where do uploads land" is the question, and the
      // endpoint only matters for telling one provider from another
      label: t('platform:labelStorage'),
      provider: data.integrations.storageBucket ? 's3' : null,
      value: [
        data.integrations.storageBucket,
        data.integrations.storageEndpoint
      ]
        .filter(Boolean)
        .join(' · ')
    },
    {
      // Last, but the one the others depend on — Fly's certificate token is
      // read from here, so this row explains a domains panel that cannot
      // reach Fly at all
      label: t('platform:labelInfisical'),
      provider: data.integrations.infisicalAuth ? 'infisical' : null,
      value: [data.integrations.infisicalSite, data.integrations.infisicalAuth]
        .filter(Boolean)
        .join(' · ')
    }
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* No `items-start`: the widgets should stretch to the tallest in the
          row, so a long detail line does not leave its neighbours short */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatusWidget
          icon={ShieldCheckIcon}
          tone={domains.tone}
          title={t('platform:domainsTitle')}
          metric={t('platform:domainsMetric', { count: data.domains.length })}
          detail={domainsDetail}
          openLabel={t('platform:domainsOpen')}
          onOpen={
            data.domains.length ? () => setOpenSheet('domains') : undefined
          }
        />
        <StatusWidget
          icon={PuzzlePieceIcon}
          tone={integrations.tone}
          title={t('platform:integrationsTitle')}
          metric={t('platform:integrationsMetric', {
            count: configured.filter(Boolean).length,
            total: configured.length
          })}
          detail={integrationsDetail}
          openLabel={t('platform:integrationsOpen')}
          onOpen={() => setOpenSheet('integrations')}
        />
        <StatusWidget
          icon={CubeIcon}
          tone={build.tone}
          title={t('platform:buildTitle')}
          metric={data.build.version}
          detail={
            build.kind === 'unstamped'
              ? t('platform:buildUnstamped')
              : [
                  data.build.deployEnv,
                  data.build.appMode === 'host'
                    ? t('platform:modeHost')
                    : t('platform:modeTenant'),
                  data.build.sha
                ]
                  .filter(Boolean)
                  .join(' · ')
          }
        />
      </div>

      <Sheet
        open={openSheet === 'domains'}
        onOpenChange={(open) => !open && setOpenSheet(null)}
      >
        <SheetContent size="lg" className="codeware-admin twp gap-0">
          <SheetHeader>
            <SheetTitle>{t('platform:domainsTitle')}</SheetTitle>
            <SheetDescription>{t('platform:domainsSheetSub')}</SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-0.5 overflow-y-auto px-2 pb-4">
            {[...data.domains].sort(byWorstFirst).map((item) => (
              <DomainStatusRow
                key={`${item.hostname}|${item.app}`}
                item={item}
                labels={rowLabels}
                linkComponent={Link}
              />
            ))}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet
        open={openSheet === 'integrations'}
        onOpenChange={(open) => !open && setOpenSheet(null)}
      >
        <SheetContent size="lg" className="codeware-admin twp gap-0">
          <SheetHeader>
            <SheetTitle>{t('platform:integrationsTitle')}</SheetTitle>
            <SheetDescription>
              {t('platform:integrationsSheetSub')}
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col overflow-y-auto px-4 pb-4">
            {integrationRows.map((row) => (
              <IntegrationRow
                key={row.label}
                label={row.label}
                provider={row.provider}
                value={row.value}
                notConfiguredLabel={t('platform:notConfigured')}
              />
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

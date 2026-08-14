'use client';

import type {
  CertificateState,
  DomainSecretsReport,
  TenantDomain
} from '@codeware/app-cms/feature/domains';
import type {
  TranslationsKeys,
  TranslationsObject
} from '@codeware/app-cms/util/i18n';
import { CopyButton } from '@codeware/shared/ui/copy-button';
import { Button } from '@codeware/shared/ui/shadcn/components/button';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { useDocumentInfo, useFormFields, useTranslation } from '@payloadcms/ui';
import { getDataByPath } from 'payload/shared';
import React, { useCallback, useMemo, useState } from 'react';

import { usePayloadSdk } from '../utils/use-payload-sdk';

type Action = 'request' | 'check' | 'remove';

type Translate = (
  key: TranslationsKeys,
  vars?: Record<string, unknown>
) => string;

/** A stored certificate, as it reads back out of the database */
type Stored = NonNullable<TenantDomain['certificate']>;

/** How one domain reads right now, once stored and fresh answers are merged */
type Row = {
  hostname: string;
  app: string;
  certificate: Stored | null;
  /** Where Infisical mentions the domain; only known after a check */
  secrets: DomainSecretsReport | null;
  /** The endpoint acts on stored rows, so an unsaved one has nothing to act on */
  saved: boolean;
};

const isRateLimited = (until: string | null | undefined) =>
  Boolean(until && new Date(until).getTime() > Date.now());

/** A certificate exists once Fly has told us something about one */
const wasRequested = (certificate: Stored | null) =>
  Boolean(certificate?.status);

/** Distinguishes a machine restart from a per-hostname action in `busy` */
const restartKey = (app: string) => `restart:${app}`;

/** Identifies a row by the pair both endpoints act on */
const domainKey = (hostname: string, app: string) => `${hostname}|${app}`;

/**
 * Certificate state and dns instructions for a workspace's custom domains.
 *
 * A custom domain needs two halves, and neither side can finish alone: the
 * platform asks Fly for a certificate, and whoever owns the domain creates the
 * dns records that let it validate. This panel drives the first half and spells
 * out the second — which records to create, and whether Fly can see them yet.
 *
 * It renders what was stored at the last check rather than calling Fly on every
 * page load. The workspace view then keeps working when Fly does not, every
 * call is something a person asked for, and `checked …` says how old the answer
 * is instead of implying it is live.
 */
export const DomainsPanel: React.FC<{ language: string }> = ({ language }) => {
  const { t } = useTranslation<TranslationsObject, TranslationsKeys>();
  const { id, data } = useDocumentInfo();
  const { sdk } = usePayloadSdk();
  const fields = useFormFields(([formFields]) => formFields);

  /**
   * The live `domains` array, reconstructed from the form's flattened field
   * state rather than read with `useField`.
   *
   * Payload stores an array field's own `value` as its row *count*, not its
   * data — the rows live at `domains.0.hostname` etc, and `forceFullValue`
   * (which would return the real array) is an internal `buildFormState`
   * option the client never gets to set. `getDataByPath` is the same
   * reconstruction Payload's own `getData()` uses internally, and is the
   * documented way to read a full array/blocks value from field state.
   */
  const domains = useMemo(
    () => getDataByPath<Array<TenantDomain>>(fields, 'domains') ?? [],
    [fields]
  );

  /**
   * Answers received since the page loaded.
   *
   * Kept here rather than pushed into the form: the endpoint has already
   * written them, and `setValue` would leave the document looking unsaved over
   * a change nobody made.
   */
  const [fresh, setFresh] = useState<Record<string, CertificateState | null>>(
    {}
  );
  /** Infisical reports are never stored — they describe another system's state */
  const [secrets, setSecrets] = useState<
    Record<string, DomainSecretsReport | null>
  >({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const dateFormat = useMemo(
    () =>
      new Intl.DateTimeFormat(language, {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      }),
    [language]
  );

  const formatDate = useCallback(
    (iso: string) => dateFormat.format(new Date(iso)),
    [dateFormat]
  );

  const run = useCallback(
    async (hostname: string, action: Action) => {
      setBusy(hostname);
      setError(null);
      try {
        const response = await sdk.request({
          method: 'POST',
          path: '/tenant-domain-certificate',
          json: { tenant: id, hostname, action }
        });

        const body = (await response.json()) as {
          certificate?: CertificateState | null;
          secrets?: DomainSecretsReport | null;
          error?: string;
        };

        if (!response.ok) {
          // Fly's own wording names rate limits, unknown apps and permission
          // problems far better than anything generic
          setError(body.error || t('domains:actionFailed'));
          return;
        }

        setFresh((current) => ({
          ...current,
          [hostname]: body.certificate ?? null
        }));
        setSecrets((current) => ({
          ...current,
          // A request or a removal says nothing about Infisical, so an earlier
          // report stays rather than being replaced with a false "none found"
          [hostname]: body.secrets ?? current[hostname] ?? null
        }));
      } catch {
        setError(t('domains:actionFailed'));
      } finally {
        setBusy(null);
      }
    },
    [id, sdk, t]
  );

  const runRestart = useCallback(
    async (app: string) => {
      setBusy(restartKey(app));
      setError(null);
      try {
        const response = await sdk.request({
          method: 'POST',
          path: '/tenant-machine-restart',
          json: { tenant: id, app }
        });

        if (!response.ok) {
          const body = (await response.json()) as { error?: string };
          setError(body.error || t('domains:actionFailed'));
        }
      } catch {
        setError(t('domains:actionFailed'));
      } finally {
        setBusy(null);
      }
    },
    [id, sdk, t]
  );

  /**
   * Hostname and app pairs the server already has, which is what makes a row
   * actionable.
   *
   * Read from the document as loaded/last saved rather than the live form
   * state — an in-progress edit should not make a row look actionable before
   * it exists anywhere but this form. The pair is what matters, not the
   * hostname alone: both endpoints act on the stored app, so an edited but
   * unsaved app would act on something other than what the row shows.
   */
  const savedDomains = useMemo(
    () =>
      new Set(
        ((data?.['domains'] as Array<TenantDomain> | undefined) ?? [])
          .filter(
            (
              domain
            ): domain is TenantDomain & { hostname: string; app: string } =>
              Boolean(domain.hostname && domain.app)
          )
          .map((domain) => domainKey(domain.hostname, domain.app))
      ),
    [data]
  );

  const rows: Array<Row> = useMemo(
    () =>
      domains
        .filter(
          (
            domain
          ): domain is TenantDomain & { hostname: string; app: string } =>
            Boolean(domain.hostname && domain.app)
        )
        .map(({ hostname, app, certificate }) => ({
          hostname,
          app,
          certificate:
            hostname in fresh ? fresh[hostname] : (certificate ?? null),
          secrets: secrets[hostname] ?? null,
          saved: savedDomains.has(domainKey(hostname, app))
        })),
    [domains, fresh, savedDomains, secrets]
  );

  /**
   * Distinct Fly apps with at least one active certificate.
   *
   * Grouped by app rather than one button per domain row — several domains
   * can share an app, and two buttons for the same restart would read as two
   * different actions.
   */
  const restartableApps = useMemo(
    () =>
      Array.from(
        new Set(
          rows
            .filter((row) => row.saved && row.certificate?.isConfigured)
            .map((row) => row.app)
        )
      ),
    [rows]
  );

  if (!rows.length) {
    return null;
  }

  return (
    // Payload's own fields carry their spacing in the admin stylesheet; a
    // custom ui field brings none, so it has to reserve its own room
    <div className="codeware-admin twp mt-2 mb-6 flex flex-col gap-3">
      <h4 className="flex items-center gap-2 text-sm font-medium">
        <ShieldCheckIcon className="size-4" />
        {t('domains:heading')}
      </h4>

      {rows.map((row) => (
        <DomainRow
          key={row.hostname}
          row={row}
          busy={busy === row.hostname}
          disabled={busy !== null}
          formatDate={formatDate}
          onAction={(action) => void run(row.hostname, action)}
          t={t}
        />
      ))}

      {restartableApps.length > 0 && (
        <div className="border-border flex flex-col gap-2 rounded-lg border px-3 py-2 text-sm">
          <p className="text-muted-foreground">{t('domains:restartHint')}</p>
          {restartableApps.map((app) => (
            <div
              key={app}
              className="flex flex-wrap items-center justify-between gap-2"
            >
              <span className="font-medium">{app}</span>
              <Button
                variant="outline"
                size="sm"
                disabled={busy !== null}
                onClick={() => void runRestart(app)}
              >
                <ArrowPathIcon
                  className={
                    busy === restartKey(app) ? 'size-4 animate-spin' : 'size-4'
                  }
                />
                {t('domains:restart')}
              </Button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm text-(--destructive-subtle)">
          {error}
        </p>
      )}
    </div>
  );
};

type RowProps = {
  row: Row;
  busy: boolean;
  disabled: boolean;
  formatDate: (iso: string) => string;
  onAction: (action: Action) => void;
  t: Translate;
};

const DomainRow: React.FC<RowProps> = ({
  row,
  busy,
  disabled,
  formatDate,
  onAction,
  t
}) => {
  const { certificate } = row;
  const requested = wasRequested(certificate);
  const active = Boolean(certificate?.isConfigured);
  const paused = isRateLimited(certificate?.rateLimitedUntil);

  return (
    <div className="border-border flex flex-col gap-2 rounded-lg border px-3 py-2 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <span className="font-medium">{row.hostname}</span>
          <span className="text-muted-foreground">{row.app}</span>
        </span>
        <Status
          active={active}
          paused={paused}
          requested={requested}
          status={certificate?.status ?? null}
          t={t}
        />
      </div>

      {certificate?.checkedAt && (
        <span className="text-muted-foreground text-xs">
          {t('domains:checkedAt', { when: formatDate(certificate.checkedAt) })}
        </span>
      )}

      {paused && certificate?.rateLimitedUntil && (
        <p className="text-(--destructive-subtle)">
          {t('domains:rateLimited', {
            when: formatDate(certificate.rateLimitedUntil)
          })}
        </p>
      )}

      {requested && !active && certificate && (
        <DnsRecords certificate={certificate} t={t} />
      )}

      {row.secrets && <SecretsReport report={row.secrets} t={t} />}

      {!row.saved ? (
        <p className="text-muted-foreground">{t('domains:saveFirst')}</p>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {!requested ? (
            <Button
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={() => onAction('request')}
            >
              <ShieldCheckIcon className="size-4" />
              {t('domains:request')}
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                disabled={disabled}
                onClick={() => onAction('check')}
              >
                <ArrowPathIcon
                  className={busy ? 'size-4 animate-spin' : 'size-4'}
                />
                {t('domains:check')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={disabled}
                onClick={() => onAction('remove')}
              >
                <TrashIcon className="size-4" />
                {t('domains:remove')}
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const Status: React.FC<{
  active: boolean;
  paused: boolean;
  requested: boolean;
  status: string | null;
  t: Translate;
}> = ({ active, paused, requested, status, t }) => {
  if (active) {
    return (
      <span className="flex items-center gap-1.5">
        <CheckCircleIcon className="size-4" />
        {t('domains:active')}
      </span>
    );
  }

  if (paused) {
    return (
      <span className="flex items-center gap-1.5 text-(--destructive-subtle)">
        <ExclamationTriangleIcon className="size-4" />
        {t('domains:paused')}
      </span>
    );
  }

  return (
    <span className="text-muted-foreground flex items-center gap-1.5">
      <ClockIcon className="size-4" />
      {/* Fly's own summary when there is one — more specific than anything
          this panel could invent */}
      {requested ? (status ?? t('domains:pending')) : t('domains:notRequested')}
    </span>
  );
};

/**
 * What Infisical says about the domain, which the certificate cannot answer.
 *
 * A valid certificate only means Fly will terminate TLS for the hostname. The
 * app still has to be told to serve that url, and the cms still has to accept
 * it as an origin — both edited by hand in Infisical. Without this, a fully
 * issued certificate reads as "done" while the site returns nothing.
 */
const SecretsReport: React.FC<{
  report: DomainSecretsReport;
  t: Translate;
}> = ({ report, t }) => {
  if (report.unavailable) {
    return (
      <p className="text-muted-foreground">{t('domains:secretsUnavailable')}</p>
    );
  }

  if (!report.secrets.length) {
    return (
      <p className="text-(--destructive-subtle)">
        {t('domains:secretsMissing')}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {report.secrets.map(({ path, key, isCorsTagged }) => (
        <span key={`${path}|${key}`} className="text-muted-foreground text-xs">
          <span className="font-mono">
            {path}/{key}
          </span>
          {isCorsTagged && ` · ${t('domains:secretCorsTag')}`}
        </span>
      ))}
      {!report.hasCors && (
        <p className="text-(--destructive-subtle)">
          {t('domains:corsMissing')}
        </p>
      )}
    </div>
  );
};

const DnsRecords: React.FC<{ certificate: Stored; t: Translate }> = ({
  certificate,
  t
}) => {
  const name = certificate.dnsValidationHostname;
  const target = certificate.dnsValidationTarget;

  return (
    <div className="bg-muted/40 flex flex-col gap-2 rounded-md px-3 py-2">
      <p className="text-muted-foreground">{t('domains:dnsLede')}</p>

      {name && target && (
        <div className="relative pr-10">
          <div className="font-mono text-xs break-all">
            <div>CNAME {name}</div>
            <div className="text-muted-foreground">→ {target}</div>
          </div>
          <CopyButton code={target} />
        </div>
      )}

      {certificate.dnsValidationInstructions && (
        <p className="whitespace-pre-line">
          {certificate.dnsValidationInstructions}
        </p>
      )}

      {certificate.isApex && (
        <p className="text-muted-foreground">{t('domains:apexNote')}</p>
      )}
    </div>
  );
};

export default DomainsPanel;

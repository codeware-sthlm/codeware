import { Button } from '@codeware/shared/ui/shadcn/components/button';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

import { DnsRecord, type DnsRecordProps } from './dns-record';
import { SecretsReport, type SecretsReportProps } from './secrets-report';

/** What a domain's certificate is doing, as the card needs to tell it apart */
export type DomainCertificateStatus =
  | 'not-requested'
  | 'pending'
  | 'active'
  | 'paused';

export type DomainAction = 'request' | 'check' | 'remove';

export type DomainCardProps = {
  hostname: string;
  /** Fly app that serves the domain */
  app: string;
  status: DomainCertificateStatus;
  /**
   * Fly's own wording for a pending certificate, which names the step it is
   * waiting on better than the generic label
   */
  statusDetail?: string | null;
  /** Pre-formatted "Checked 14 Aug 22:42"; the panel owns date formatting */
  checkedLabel?: string | null;
  /** Pre-composed sentence naming when the rate limit lifts */
  pausedMessage?: string | null;
  /** The record to create at the registrar, until the certificate is active */
  dns?: DnsRecordProps['record'] | null;
  /** What Infisical says; unknown until a check has asked */
  secrets?: SecretsReportProps['report'] | null;
  /** A row the server does not have yet cannot be acted on */
  saved: boolean;
  /** The action running on this row, which is the one that spins */
  runningAction?: DomainAction | null;
  /** An action running anywhere, which locks every button */
  disabled?: boolean;
  labels: {
    active: string;
    pending: string;
    notRequested: string;
    paused: string;
    saveFirst: string;
    request: string;
    check: string;
    remove: string;
    copyRecord: string;
    dnsLede: string;
    apexNote: string;
    secretCorsTag: string;
    secretsMissing: string;
    secretsUnavailable: string;
    corsMissing: string;
  };
  onAction: (action: DomainAction) => void;
};

/**
 * One custom domain: what its certificate is doing, and what is left to do.
 *
 * A custom domain needs two halves, and neither side can finish alone: the
 * platform asks Fly for a certificate, and whoever owns the domain creates the
 * dns records that let it validate. The card drives the first half and spells
 * out the second — which record to create, whether Fly can see it yet, and
 * whether the deployment secrets point here at all.
 *
 * Presentational and hook-free: every label arrives translated and every date
 * pre-formatted, so the same card renders in the admin and in Storybook.
 */
export function DomainCard({
  hostname,
  app,
  status,
  statusDetail,
  checkedLabel,
  pausedMessage,
  dns,
  secrets,
  saved,
  runningAction,
  disabled = false,
  labels,
  onAction
}: DomainCardProps) {
  const requested = status !== 'not-requested';
  const active = status === 'active';

  return (
    <div className="border-border flex flex-col gap-3 rounded-lg border px-4 py-3.5 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
        <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="font-medium">{hostname}</span>
          <span className="text-muted-foreground text-xs">{app}</span>
        </span>
        <Status status={status} detail={statusDetail} labels={labels} />
      </div>

      {checkedLabel && (
        <span className="text-muted-foreground -mt-2 text-xs">
          {checkedLabel}
        </span>
      )}

      {status === 'paused' && pausedMessage && (
        <p className="text-(--destructive-subtle)">{pausedMessage}</p>
      )}

      {/* An active certificate has nothing left to validate, so the record it
          was validated with is only noise from here on */}
      {requested && !active && dns && (
        <DnsRecord
          record={dns}
          lede={labels.dnsLede}
          apexNote={labels.apexNote}
          copyLabel={labels.copyRecord}
        />
      )}

      {secrets && (
        <SecretsReport
          report={secrets}
          labels={{
            corsTag: labels.secretCorsTag,
            missing: labels.secretsMissing,
            unavailable: labels.secretsUnavailable,
            corsMissing: labels.corsMissing
          }}
        />
      )}

      {saved ? (
        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          {!requested ? (
            <Button
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={() => onAction('request')}
            >
              <ActionIcon
                idle={ShieldCheckIcon}
                running={runningAction === 'request'}
              />
              {labels.request}
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                disabled={disabled}
                onClick={() => onAction('check')}
              >
                <ActionIcon
                  idle={ArrowPathIcon}
                  running={runningAction === 'check'}
                />
                {labels.check}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={disabled}
                onClick={() => onAction('remove')}
              >
                <ActionIcon
                  idle={TrashIcon}
                  running={runningAction === 'remove'}
                />
                {labels.remove}
              </Button>
            </>
          )}
        </div>
      ) : (
        <p className="text-muted-foreground">{labels.saveFirst}</p>
      )}
    </div>
  );
}

type IconComponent = React.ComponentType<{ className?: string }>;

/**
 * A button's icon, replaced by a spinner while that button is the one working.
 *
 * Per action rather than per row: with one shared flag, asking for a check
 * would spin the remove button too.
 */
function ActionIcon({
  idle: Idle,
  running
}: {
  idle: IconComponent;
  running: boolean;
}) {
  return running ? (
    <ArrowPathIcon className="size-4 animate-spin" />
  ) : (
    <Idle className="size-4" />
  );
}

function Status({
  status,
  detail,
  labels
}: {
  status: DomainCertificateStatus;
  detail?: string | null;
  labels: Pick<
    DomainCardProps['labels'],
    'active' | 'paused' | 'pending' | 'notRequested'
  >;
}) {
  if (status === 'active') {
    return (
      <span className="flex items-center gap-1.5 font-medium text-(--success-subtle)">
        <CheckCircleIcon className="size-4" />
        {labels.active}
      </span>
    );
  }

  if (status === 'paused') {
    return (
      <span className="flex items-center gap-1.5 text-(--destructive-subtle)">
        <ExclamationTriangleIcon className="size-4" />
        {labels.paused}
      </span>
    );
  }

  return (
    <span className="text-muted-foreground flex items-center gap-1.5">
      <ClockIcon className="size-4" />
      {status === 'pending' ? (detail ?? labels.pending) : labels.notRequested}
    </span>
  );
}

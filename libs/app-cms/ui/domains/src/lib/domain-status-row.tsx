import type React from 'react';

import {
  type DomainCertificateStatus,
  DomainStatusBadge
} from './domain-status-badge';
import { isExpiringSoon } from './expiry';

/**
 * Anchor-compatible component slot so the host app can inject its router link.
 *
 * Declared here rather than imported from `ui/dashboard`: the dashboard reads
 * this lib's types for the platform overview, and borrowing one back would
 * make the two libs depend on each other over four lines of structural type.
 */
type LinkComponent =
  | React.ComponentType<
      React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }
    >
  | 'a';

/**
 * One custom domain, flattened for the platform overview.
 *
 * Everything here comes from what the last check stored on the row — the
 * overview never calls Fly, so a domain nobody has checked reads as exactly
 * that rather than as a problem.
 */
export type DomainStatusItem = {
  hostname: string;
  /** Fly app that serves it */
  app: string;
  status: DomainCertificateStatus;
  /** Fly's own wording for a pending certificate */
  statusDetail?: string | null;
  /** Whether the last check left issues Fly is still objecting to */
  hasIssues: boolean;
  /** Pre-formatted "Checked 14 Aug 22:42"; null when none has ever run */
  checkedLabel?: string | null;
  /** ISO expiry of the issued certificate, when one has been recorded */
  expiresAt?: string | null;
  /** Admin url of the document that owns this domain */
  href: string;
  /** Who owns it — the workspace name, or the platform */
  owner: string;
};

/** What the domains widget says, before it is put into words */
export type DomainsVerdict =
  | { tone: 'neutral'; kind: 'none'; count: 0 }
  | { tone: 'ok'; kind: 'all-active'; count: number }
  | { tone: 'error'; kind: 'paused'; count: number }
  | { tone: 'error'; kind: 'issues'; count: number }
  | { tone: 'warning'; kind: 'not-requested'; count: number }
  | { tone: 'warning'; kind: 'expiring'; count: number }
  | { tone: 'warning'; kind: 'pending'; count: number };

/**
 * The states worth reporting, worst first.
 *
 * One table, because two orderings would drift: the widget quotes the worst
 * state it finds here, and the sheet sorts by the same ranking — so the first
 * row a reader sees is always the one the widget is talking about. Ranked by
 * what it costs to ignore: a rate limit blocks issuance for hours, an active
 * certificate Fly still objects to is serving traffic it may stop serving, a
 * domain nobody requested one for has no tls at all, an expiring one has a
 * deadline, and a pending one is usually just young.
 */
const STATES = [
  {
    kind: 'paused',
    tone: 'error',
    match: (item: DomainStatusItem) => item.status === 'paused'
  },
  {
    kind: 'issues',
    tone: 'error',
    match: (item: DomainStatusItem) => item.hasIssues
  },
  {
    kind: 'not-requested',
    tone: 'warning',
    match: (item: DomainStatusItem) => item.status === 'not-requested'
  },
  {
    kind: 'expiring',
    tone: 'warning',
    match: (item: DomainStatusItem, now: Date) =>
      isExpiringSoon(item.expiresAt, now)
  },
  {
    kind: 'pending',
    tone: 'warning',
    match: (item: DomainStatusItem) => item.status === 'pending'
  }
] as const satisfies ReadonlyArray<{
  kind: DomainsVerdict['kind'];
  tone: DomainsVerdict['tone'];
  match: (item: DomainStatusItem, now: Date) => boolean;
}>;

/**
 * Reduce every domain to the one thing worth saying about all of them.
 *
 * Returns the count of domains in the worst state rather than a total, since
 * that is the number the detail line quotes.
 *
 * @param now - Injectable clock, so the expiry window is testable
 */
export const summarizeDomains = (
  items: Array<DomainStatusItem>,
  now: Date = new Date()
): DomainsVerdict => {
  if (!items.length) {
    return { tone: 'neutral', kind: 'none', count: 0 };
  }

  for (const { kind, tone, match } of STATES) {
    const count = items.filter((item) => match(item, now)).length;
    if (count) {
      return { tone, kind, count } as DomainsVerdict;
    }
  }

  return { tone: 'ok', kind: 'all-active', count: items.length };
};

/** Where a domain sits in {@link STATES}; healthy sorts last */
const severity = (item: DomainStatusItem, now: Date) => {
  const index = STATES.findIndex(({ match }) => match(item, now));
  return index === -1 ? STATES.length : index;
};

/**
 * Order the sheet so the reason the widget is not green is the first row.
 *
 * Shares {@link STATES} with `summarizeDomains` rather than keeping its own
 * ranking — an independent order let an active-but-objected-to domain sort
 * above a rate-limited one, and ignored expiry entirely, so the sheet could
 * open on a row that had nothing to do with what the widget said.
 */
export const byWorstFirst = (a: DomainStatusItem, b: DomainStatusItem) => {
  const now = new Date();
  return (
    severity(a, now) - severity(b, now) || a.hostname.localeCompare(b.hostname)
  );
};

export type DomainStatusRowProps = {
  item: DomainStatusItem;
  labels: {
    active: string;
    pending: string;
    notRequested: string;
    paused: string;
    /** Suffix marking an active certificate that still has open issues */
    hasIssues: string;
    neverChecked: string;
  };
  linkComponent?: LinkComponent;
};

/**
 * One domain in the platform overview's sheet.
 *
 * Read-only by design: every action lives on the panel inside the document
 * that owns the domain, and the row links there. Two places to press *Check
 * now* would be two places to be unsure which one ran.
 */
export function DomainStatusRow({
  item,
  labels,
  linkComponent: LinkComp = 'a'
}: DomainStatusRowProps) {
  return (
    <LinkComp
      href={item.href}
      className="hover:bg-muted/60 focus-visible:ring-ring flex items-center gap-3 rounded-md px-2 py-2 focus-visible:ring-2 focus-visible:outline-none"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{item.hostname}</p>
        <p className="text-muted-foreground truncate text-xs">
          {[item.owner, item.app, item.checkedLabel ?? labels.neverChecked]
            .filter(Boolean)
            .join(' · ')}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {item.hasIssues && (
          <span className="text-xs text-(--destructive-subtle)">
            {labels.hasIssues}
          </span>
        )}
        <DomainStatusBadge
          status={item.status}
          detail={item.statusDetail}
          labels={labels}
        />
      </div>
    </LinkComp>
  );
}

import type React from 'react';

import {
  type DomainCertificateStatus,
  DomainStatusBadge
} from './domain-status-badge';

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
  | { tone: 'warning'; kind: 'pending'; count: number };

/**
 * Reduce every domain to the one thing worth saying about all of them.
 *
 * Worst wins, and the order is by how much it costs to ignore: a rate limit
 * blocks issuance for hours, an active certificate Fly still objects to is
 * serving traffic it may stop serving, a domain nobody ever requested one for
 * has no tls at all, and a pending one is usually just young.
 *
 * Returns the count of domains in the worst state rather than a total, since
 * that is the number the detail line quotes.
 */
export const summarizeDomains = (
  items: Array<DomainStatusItem>
): DomainsVerdict => {
  if (!items.length) {
    return { tone: 'neutral', kind: 'none', count: 0 };
  }

  const count = (predicate: (item: DomainStatusItem) => boolean) =>
    items.filter(predicate).length;

  const paused = count((item) => item.status === 'paused');
  if (paused) {
    return { tone: 'error', kind: 'paused', count: paused };
  }

  const issues = count((item) => item.hasIssues);
  if (issues) {
    return { tone: 'error', kind: 'issues', count: issues };
  }

  const notRequested = count((item) => item.status === 'not-requested');
  if (notRequested) {
    return { tone: 'warning', kind: 'not-requested', count: notRequested };
  }

  const pending = count((item) => item.status === 'pending');
  if (pending) {
    return { tone: 'warning', kind: 'pending', count: pending };
  }

  return { tone: 'ok', kind: 'all-active', count: items.length };
};

/** How badly a domain needs looking at, so the worst sorts to the top */
const SEVERITY: Record<DomainCertificateStatus, number> = {
  paused: 0,
  'not-requested': 1,
  pending: 2,
  active: 3
};

/**
 * Order the sheet so the reason the widget is not green is the first row.
 *
 * An active certificate with outstanding issues outranks its plain status —
 * it is the case that looks fine everywhere else and is not.
 */
export const byWorstFirst = (a: DomainStatusItem, b: DomainStatusItem) => {
  const rank = (item: DomainStatusItem) =>
    item.hasIssues ? -1 : SEVERITY[item.status];
  return rank(a) - rank(b) || a.hostname.localeCompare(b.hostname);
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

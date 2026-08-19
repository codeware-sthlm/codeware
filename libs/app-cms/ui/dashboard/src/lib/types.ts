import type { DomainStatusItem } from '@codeware/app-cms/ui/domains';
import type { CollectionSlug } from '@codeware/shared/util/payload-types';
import type React from 'react';

import type { BuildFacts, IntegrationFacts } from './platform-status';

/** Heroicons-compatible SVG icon component. */
export type IconComponent = React.FC<React.ComponentPropsWithoutRef<'svg'>>;

/**
 * Anchor-compatible component slot so the host app can inject its router
 * link (e.g. Next.js `Link`) while Storybook and tests render a plain `<a>`.
 */
export type LinkComponent =
  | React.ComponentType<
      React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }
    >
  | 'a';

/** Serializable document summary rendered in activity and draft lists. */
export type RecentDoc = {
  id: string;
  title: string;
  collectionSlug: CollectionSlug;
  createdAt: string;
  updatedAt: string;
  status?: string;
};

/** Active top-level dashboard tab. */
export type DashboardTab = 'home' | 'content' | 'platform';

/**
 * What the platform tab's widgets render, gathered server-side.
 *
 * Facts rather than verdicts: the tone and the wording are derived in the
 * client, where the translations are, so the same data can say "2 pending" in
 * either language without the server knowing which.
 */
export type PlatformData = {
  /** Every custom domain, across all workspaces and the platform itself */
  domains: Array<DomainStatusItem>;
  integrations: IntegrationFacts;
  build: BuildFacts;
};

/** Server-fetched props contract for the admin dashboard view. */
export type DashboardData = {
  userName: string;
  counts: Record<string, number>;
  /**
   * Per-slug counts that override `counts` on the task cards only, where the
   * useful number differs from the collection total (unread messages, say).
   */
  taskCounts: Record<string, number>;
  recentDocs: RecentDoc[];
  drafts: RecentDoc[];
  /**
   * Tab to show on first paint, resolved server-side from user preferences.
   * Seeding it here (rather than hydrating in an effect) avoids a mount flash.
   */
  initialActiveTab: DashboardTab;
  /**
   * Platform-wide status for the platform tab, or `null` for a user who may
   * not see it.
   *
   * Null rather than empty: the tab is hidden on the same fact, so one value
   * decides both and they cannot drift into a visible-but-empty tab.
   */
  platform: PlatformData | null;
};

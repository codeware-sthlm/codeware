import type { CollectionSlug } from '@codeware/shared/util/payload-types';
import type React from 'react';

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
export type DashboardTab = 'home' | 'content';

/** Server-fetched props contract for the admin dashboard view. */
export type DashboardData = {
  userName: string;
  counts: Record<string, number>;
  recentDocs: RecentDoc[];
  drafts: RecentDoc[];
  /**
   * Tab to show on first paint, resolved server-side from user preferences.
   * Seeding it here (rather than hydrating in an effect) avoids a mount flash.
   */
  initialActiveTab: DashboardTab;
};

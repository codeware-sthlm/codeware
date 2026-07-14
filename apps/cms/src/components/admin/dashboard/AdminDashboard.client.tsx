'use client';

import { useTranslation } from '@payloadcms/ui';
import React from 'react';

import type { DashboardData } from '@codeware/app-cms/ui/dashboard';
import type {
  TranslationsKeys,
  TranslationsObject
} from '@codeware/app-cms/util/i18n';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@codeware/shared/ui/shadcn/components/tabs';

import { AllContentTab } from './AllContentTab.client';
import { HomeTab } from './HomeTab.client';
import { useActiveTab } from './use-active-tab';

/*
 * Underline tabs on the `line` TabsList variant (kills the default variant's
 * active bg/shadow box). The underline is our own bottom border instead of
 * the variant's `after:` bar; the dark `group-data-[variant=line]` override
 * must be spelled out at the same specificity as the base class it replaces.
 */
const TAB_TRIGGER_CLASSES =
  'text-muted-foreground hover:text-foreground -mb-px h-auto flex-none rounded-none border-0 border-b-2 border-transparent px-0 py-3.5 text-sm font-semibold transition-colors after:hidden data-active:border-(--link) data-active:text-foreground dark:data-active:border-(--link) dark:group-data-[variant=line]/tabs-list:data-active:border-(--link)';

/**
 * Custom admin dashboard: the tabbed shell hosting the Home and All-content
 * tabs.
 *
 * Presentational container — tab behavior and each tab's data handling live
 * in dedicated hooks and tab components.
 */
export const AdminDashboard: React.FC<DashboardData> = ({
  userName,
  counts,
  recentDocs,
  drafts,
  initialActiveTab
}) => {
  const { t } = useTranslation<TranslationsObject, TranslationsKeys>();
  const { activeTab, changeTab } = useActiveTab(initialActiveTab);

  return (
    /* `codeware-admin` is a structural marker only (scopes payload-retheme
       selectors like the tenant selector); shadcn tokens come from the
       payload-admin theme at :root. `twp` pins the Tailwind px scale. */
    /* The view renders below Payload's toolbar inside `.template-default__wrap`,
       so a plain `h-full` makes it one toolbar-height too tall — the overflow
       pushes the tab strip up under the toolbar. Claim only what's left. */
    <div className="codeware-admin twp bg-background text-foreground flex h-[calc(100%-var(--app-header-height))] flex-col">
      <Tabs
        value={activeTab}
        onValueChange={changeTab}
        className="flex h-full flex-col gap-0"
      >
        {/* `pb-0` keeps the active underline on the list's bottom border; the
         * top padding is what separates the tab labels from the toolbar. */}
        <TabsList
          variant="line"
          className="border-border h-auto w-full justify-start gap-6 rounded-none border-b px-7.5 pt-4 pb-0"
        >
          <TabsTrigger value="home" className={TAB_TRIGGER_CLASSES}>
            {t('dashboard:tabHome')}
          </TabsTrigger>
          <TabsTrigger value="content" className={TAB_TRIGGER_CLASSES}>
            {t('dashboard:tabAllContent')}
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="home"
          className="mt-0 flex-1 overflow-y-auto px-7.5 pt-7 pb-10"
        >
          <HomeTab
            userName={userName}
            counts={counts}
            recentDocs={recentDocs}
            drafts={drafts}
          />
        </TabsContent>
        <TabsContent
          value="content"
          className="mt-0 flex-1 overflow-y-auto px-7.5 pt-7 pb-10"
        >
          <AllContentTab counts={counts} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;

'use client';

import { useAuth, useTranslation } from '@payloadcms/ui';
import Link from 'next/link';
import type { ClientCollectionConfig } from 'payload';
import { useMemo } from 'react';

import {
  CollectionCard,
  type DashboardData,
  getSlugIcon
} from '@codeware/app-cms/ui/dashboard';
import { isGlobalCollectionSlug } from '@codeware/app-cms/util/definitions';
import type {
  TranslationsKeys,
  TranslationsObject
} from '@codeware/app-cms/util/i18n';
import type { User } from '@codeware/shared/util/payload-types';

import { localize } from '../utils/localize';
import { useVisibleCollections } from '../utils/use-visible-collections';

import { hasCreatePermission } from './has-create-permission';

/**
 * Dashboard All-content tab: one card per visible collection, grouped by the
 * collection's admin group.
 */
export function AllContentTab({ counts }: Pick<DashboardData, 'counts'>) {
  const { permissions } = useAuth<User>();
  const { i18n, t } = useTranslation<TranslationsObject, TranslationsKeys>();
  const visibleCollections = useVisibleCollections();

  const language = i18n.language;

  const grouped = useMemo(() => {
    const map = new Map<string, ClientCollectionConfig[]>();
    for (const col of visibleCollections()) {
      const group = localize(col.admin.group, language) || '';
      map.set(group, [...(map.get(group) ?? []), col]);
    }
    return map;
  }, [visibleCollections, language]);

  return (
    <div className="flex flex-col gap-8">
      <p className="text-muted-foreground max-w-prose text-sm leading-relaxed">
        {t('dashboard:contentLead')}
      </p>

      {[...grouped.entries()].map(([groupName, collections]) => (
        <section key={groupName}>
          <h2 className="text-muted-foreground mb-3 text-xs font-semibold tracking-widest uppercase">
            {groupName}
          </h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(244px,1fr))] gap-4">
            {collections.map((col) => {
              const href = `/admin/collections/${col.slug}`;
              const count = counts[col.slug];
              // Hide "New" for globals (single-doc, no create page) and where
              // the user lacks create permission.
              const canCreate =
                !isGlobalCollectionSlug(col.slug) &&
                hasCreatePermission(permissions, col.slug);
              return (
                <CollectionCard
                  key={col.slug}
                  href={href}
                  createHref={canCreate ? `${href}/create` : undefined}
                  label={localize(col.labels.plural, language, col.slug)}
                  description={
                    localize(col.admin.description, language) || undefined
                  }
                  countLabel={
                    count !== undefined
                      ? t('dashboard:items', { count })
                      : t('dashboard:openToEdit')
                  }
                  newLabel={canCreate ? t('dashboard:newButton') : undefined}
                  icon={getSlugIcon(col.slug)}
                  linkComponent={Link}
                />
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

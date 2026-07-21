'use client';

import { useAuth, useTranslation } from '@payloadcms/ui';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';

import { PaletteRow, getSlugIcon } from '@codeware/app-cms/ui/dashboard';
import type {
  TranslationsKeys,
  TranslationsObject
} from '@codeware/app-cms/util/i18n';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@codeware/shared/ui/shadcn/components/command';
import type {
  CollectionSlug,
  PaletteSearchResultItem,
  User
} from '@codeware/shared/util/payload-types';

import { formatRelativeTime } from '../utils/relative-time';
import { useCollectionLabel } from '../utils/use-collection-label';

import { usePalette } from './PaletteProvider.client';
import { usePaletteItems } from './use-palette-items';
import { MIN_QUERY_LENGTH, usePaletteSearch } from './use-palette-search';
import { type RecentEntry, useRecentDocuments } from './use-recent-documents';

/**
 * The command palette dialog: search + quick actions/navigation/workspaces.
 *
 * Presentational container — it owns only the query input and closing; the
 * command view-models and recent/search data come from dedicated hooks.
 */
function PaletteDialog({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { i18n, t } = useTranslation<TranslationsObject, TranslationsKeys>();
  const language = i18n.language;
  const router = useRouter();

  const [query, setQuery] = useState('');

  const collectionLabel = useCollectionLabel();
  const { actionItems, navigationItems, workspaceItems, hasStaticMatches } =
    usePaletteItems(query);
  const { recent, recordRecent } = useRecentDocuments(open);
  const { status: searchStatus, results: searchResults } =
    usePaletteSearch(query);

  /**
   * Wrap the parent handler so the query resets whenever the palette closes
   * (via Escape, overlay click, or a command) — it reopens in its start state.
   */
  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) {
        setQuery('');
      }
      onOpenChange(next);
    },
    [onOpenChange]
  );

  /** Memoized close function so it can be used in callbacks without re-rendering. */
  const close = useCallback(() => handleOpenChange(false), [handleOpenChange]);

  /** Run a command's side effect, then close the palette. */
  const runAndClose = useCallback(
    (run: () => void) => {
      run();
      close();
    },
    [close]
  );

  /** Open a document in the admin, record it in the recent list and close the palette. */
  const openDocument = useCallback(
    (item: RecentEntry) => {
      recordRecent(item);
      close();
      router.push(`/admin/collections/${item.collectionSlug}/${item.id}`);
    },
    [close, recordRecent, router]
  );

  /** Group server results by collection, preserving the fixed server order. */
  const groupedResults = useMemo(() => {
    const map = new Map<CollectionSlug, PaletteSearchResultItem[]>();
    for (const item of searchResults) {
      map.set(item.collectionSlug, [
        ...(map.get(item.collectionSlug) ?? []),
        item
      ]);
    }
    return map;
  }, [searchResults]);

  /** Document search only kicks in once the query is long enough */
  const searching = query.trim().length >= MIN_QUERY_LENGTH;

  /** Determine if the empty state should be shown */
  const showEmpty =
    searching &&
    searchStatus === 'success' &&
    searchResults.length === 0 &&
    !hasStaticMatches;

  return (
    <CommandDialog
      open={open}
      onOpenChange={handleOpenChange}
      title={t('palette:dialogTitle')}
      description={t('palette:dialogDescription')}
      // spacing-scale width (680px via .twp) — the named rem sizes like
      // `max-w-lg` shrink under Payload's 13px root font
      className="codeware-admin twp sm:max-w-170"
    >
      <Command shouldFilter={false}>
        <CommandInput
          placeholder={t('palette:placeholder')}
          value={query}
          onValueChange={setQuery}
        />
        <CommandList className="max-h-[min(60vh,480px)]">
          {searching && searchStatus === 'loading' && (
            <p className="text-muted-foreground px-3 py-2 text-xs">
              {t('palette:searching')}
            </p>
          )}
          {searching && searchStatus === 'error' && (
            <p className="text-muted-foreground px-3 py-2 text-xs">
              {t('palette:searchError')}
            </p>
          )}
          {showEmpty && (
            <CommandEmpty>{t('palette:noResults', { query })}</CommandEmpty>
          )}

          {/* Document matches, grouped per collection in server order */}
          {[...groupedResults.entries()].map(([slug, items]) => (
            <CommandGroup key={slug} heading={collectionLabel(slug)}>
              {items.map((item) => (
                <CommandItem
                  key={`${slug}-${item.id}`}
                  value={`doc:${slug}:${item.id}`}
                  onSelect={() =>
                    openDocument({
                      id: item.id,
                      collectionSlug: slug,
                      title: item.title
                    })
                  }
                >
                  <PaletteRow
                    title={item.title || t('palette:untitled')}
                    meta={[
                      collectionLabel(slug),
                      formatRelativeTime(item.updatedAt, language)
                    ].join(' · ')}
                    icon={getSlugIcon(slug)}
                    badgeLabel={
                      item.status === 'draft'
                        ? t('dashboard:badgeDraft')
                        : undefined
                    }
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          ))}

          {/* Recently opened documents — start state only */}
          {!searching && recent.length > 0 && (
            <CommandGroup heading={t('palette:groupRecent')}>
              {recent.map((entry) => (
                <CommandItem
                  key={`recent-${entry.collectionSlug}-${entry.id}`}
                  value={`recent:${entry.collectionSlug}:${entry.id}`}
                  onSelect={() => openDocument(entry)}
                >
                  <PaletteRow
                    title={entry.title || t('palette:untitled')}
                    meta={collectionLabel(entry.collectionSlug)}
                    icon={getSlugIcon(entry.collectionSlug)}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {actionItems.length > 0 && (
            <CommandGroup heading={t('palette:groupActions')}>
              {actionItems.map(({ value, label, icon: Icon, run }) => (
                <CommandItem
                  key={value}
                  value={value}
                  onSelect={() => runAndClose(run)}
                >
                  <Icon className="size-4 text-(--link)" aria-hidden />
                  <span>{label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {navigationItems.length > 0 && (
            <CommandGroup heading={t('palette:groupNavigation')}>
              {navigationItems.map(({ value, label, icon: Icon, run }) => (
                <CommandItem
                  key={value}
                  value={value}
                  onSelect={() => runAndClose(run)}
                >
                  <Icon className="size-4" aria-hidden />
                  <span>{label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {workspaceItems.length > 0 && (
            <CommandGroup heading={t('palette:groupWorkspaces')}>
              {workspaceItems.map(
                ({ value, label, icon: Icon, checked, run }) => (
                  <CommandItem
                    key={value}
                    value={value}
                    onSelect={() => runAndClose(run)}
                    data-checked={checked}
                  >
                    <Icon className="size-4" aria-hidden />
                    <span>{label}</span>
                  </CommandItem>
                )
              )}
            </CommandGroup>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}

/**
 * Palette dialog bound to the provider state.
 *
 * Mounted from `PaletteTrigger` so it lives inside Payload's default
 * template, where per-user contexts (entity visibility, tenant selection)
 * are provided.
 */
export function PaletteDialogHost() {
  const { user } = useAuth<User>();
  const { open, setOpen } = usePalette();

  if (!user) return null;

  return <PaletteDialog open={open} onOpenChange={setOpen} />;
}

'use client';

import { EmptyState } from '@codeware/app-cms/ui/dashboard';
import {
  SubmissionDetail,
  SubmissionRow
} from '@codeware/app-cms/ui/submissions';
import type {
  TranslationsKeys,
  TranslationsObject
} from '@codeware/app-cms/util/i18n';
import { Button } from '@codeware/shared/ui/shadcn/components/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@codeware/shared/ui/shadcn/components/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@codeware/shared/ui/shadcn/components/sheet';
import {
  ArrowDownTrayIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  InboxIcon
} from '@heroicons/react/24/outline';
import { Gutter, SetStepNav, useTranslation } from '@payloadcms/ui';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React, { useCallback, useMemo, useState, useTransition } from 'react';

import { formatRelativeTime } from '../utils/relative-time';

import { markSubmissionsRead } from './mark-submissions-read';
import type { SubmissionFormOption, SubmissionListItem } from './types';
import { useSubmissionsSdk } from './use-submissions-sdk';

type Props = {
  rows: Array<SubmissionListItem>;
  formOptions: Array<SubmissionFormOption>;
  filter: { formId: number | null; unreadOnly: boolean; page: number };
  totalDocs: number;
  totalPages: number;
  /** Resolved collection label, used for the heading and the breadcrumb */
  collectionLabel: string;
};

/** Select needs a non-empty value for the "no filter" option */
const ALL_FORMS = 'all';

/** Values shown in a row's preview before it is truncated */
const PREVIEW_FIELDS = 3;

/** One line summarising the submission, in the form's own field order. */
function toPreview(row: SubmissionListItem): string {
  return row.fields
    .map((field) => field.value.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .slice(0, PREVIEW_FIELDS)
    .join(' · ');
}

/**
 * Submissions list: one row per message, with the full values in a sheet.
 *
 * Sits inside Payload's own list chrome — `SetStepNav` for the breadcrumb and
 * `Gutter` for the page frame — so it lines up with every other collection;
 * only the rows and the detail are ours.
 *
 * Filters are URL state so the view is linkable and survives a refresh; the
 * server component re-queries on every change. Opening a submission marks it
 * read, which is what keeps the nav badge and dashboard count meaningful.
 */
export const SubmissionsList: React.FC<Props> = ({
  rows,
  formOptions,
  filter,
  totalDocs,
  totalPages,
  collectionLabel
}) => {
  const { i18n, t } = useTranslation<TranslationsObject, TranslationsKeys>();
  const { sdk, apiRoute } = useSubmissionsSdk();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [openId, setOpenId] = useState<number | null>(null);
  // Rows already marked read in this session, so the marker clears without
  // waiting for the server round trip and refresh
  const [readIds, setReadIds] = useState<ReadonlySet<number>>(new Set());

  const openRow = useMemo(
    () => rows.find((row) => row.id === openId) ?? null,
    [rows, openId]
  );

  const isRead = useCallback(
    (row: SubmissionListItem) => row.read || readIds.has(row.id),
    [readIds]
  );

  const unreadOnPage = useMemo(
    () => rows.filter((row) => !isRead(row)).map((row) => row.id),
    [rows, isRead]
  );

  /** Replace the query string; callers reset `page` when a filter changes */
  const setParams = useCallback(
    (changes: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams?.toString() ?? '');
      for (const [key, value] of Object.entries(changes)) {
        if (value === null) {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      // Clearing every filter must land back on the bare path, not `…?`,
      // so the unfiltered view has one canonical URL
      const query = params.toString();
      startTransition(() => {
        router.push(query ? `${pathname}?${query}` : pathname, {
          scroll: false
        });
      });
    },
    [pathname, router, searchParams]
  );

  const markRead = useCallback(
    async (ids: Array<number>) => {
      if (!ids.length) {
        return;
      }
      setReadIds((current) => new Set([...current, ...ids]));

      const updated = await markSubmissionsRead(sdk, ids);
      if (!updated.length) {
        // The write was rejected — drop the optimistic state again
        setReadIds((current) => {
          const next = new Set(current);
          for (const id of ids) next.delete(id);
          return next;
        });
        return;
      }
      // Refresh so the nav badge and dashboard count follow the new state
      router.refresh();
    },
    [router, sdk]
  );

  const openSubmission = useCallback(
    (row: SubmissionListItem) => {
      setOpenId(row.id);
      if (!isRead(row)) {
        void markRead([row.id]);
      }
    },
    [isRead, markRead]
  );

  return (
    /* Payload's own list wrapper classes, so the view inherits the frame the
       admin gives every other collection */
    <div className="collection-list collection-list--form-submissions">
      <SetStepNav nav={[{ label: collectionLabel }]} />
      <Gutter className="collection-list__wrap">
        {/* Payload's own header markup and classes, so the title matches every
            other collection list rather than approximating it in Tailwind */}
        <header className="list-header">
          <div className="list-header__content">
            <div className="list-header__title-and-actions">
              <h1 className="list-header__title">{collectionLabel}</h1>
            </div>
            {/* Payload's own actions slot already lays the row out; only the
                Tailwind scope is ours — `codeware-admin` for the retheme
                selectors, `twp` for the px scale its 13px root would shrink */}
            <div className="list-header__actions codeware-admin twp">
              <Select
                value={filter.formId ? String(filter.formId) : ALL_FORMS}
                onValueChange={(value) =>
                  setParams({
                    form: value === ALL_FORMS ? null : value,
                    page: null
                  })
                }
              >
                <SelectTrigger
                  className="w-56"
                  aria-label={t('formSubmissions:filterByForm')}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_FORMS}>
                    {t('formSubmissions:allForms')}
                  </SelectItem>
                  {formOptions.map((form) => (
                    <SelectItem key={form.id} value={String(form.id)}>
                      {form.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant={filter.unreadOnly ? 'default' : 'outline'}
                aria-pressed={filter.unreadOnly}
                onClick={() =>
                  setParams({
                    unread: filter.unreadOnly ? null : 'true',
                    page: null
                  })
                }
              >
                {t('formSubmissions:unreadOnly')}
              </Button>

              <Button
                variant="outline"
                disabled={!unreadOnPage.length}
                onClick={() => void markRead(unreadOnPage)}
              >
                {t('formSubmissions:markAllRead')}
              </Button>

              {/* Icon only — spelled out it crowds the toolbar off the header.
                  Export columns are a single form's fields, so it needs a form */}
              <Button
                variant="outline"
                size="icon"
                disabled={!filter.formId}
                aria-label={t('formSubmissions:exportCsv')}
                title={
                  filter.formId
                    ? t('formSubmissions:exportCsv')
                    : t('formSubmissions:exportNeedsForm')
                }
                asChild={Boolean(filter.formId)}
              >
                {filter.formId ? (
                  <a
                    href={`${apiRoute}/form-submissions-export?form=${filter.formId}`}
                    download
                  >
                    <ArrowDownTrayIcon className="size-4" />
                  </a>
                ) : (
                  <ArrowDownTrayIcon className="size-4" />
                )}
              </Button>
            </div>
          </div>
          <div className="list-header__after-header-content">
            {t('formSubmissions:total', { count: totalDocs })}
          </div>
        </header>

        <div
          data-testid="submissions-list"
          className="codeware-admin twp text-foreground flex flex-col gap-6"
        >
          {rows.length === 0 ? (
            <div className="border-border rounded-lg border border-dashed">
              <EmptyState
                icon={InboxIcon}
                title={t('formSubmissions:emptyTitle')}
                description={t('formSubmissions:empty')}
              />
            </div>
          ) : (
            <ul
              className="border-border divide-border divide-y overflow-hidden rounded-lg border"
              data-busy={isPending || undefined}
            >
              {rows.map((row) => (
                <li key={row.id}>
                  <SubmissionRow
                    formTitle={
                      row.formTitle ?? t('formSubmissions:deletedForm')
                    }
                    preview={toPreview(row) || t('formSubmissions:noValues')}
                    receivedAt={row.receivedAt}
                    receivedLabel={formatRelativeTime(
                      row.receivedAt,
                      i18n.language
                    )}
                    read={isRead(row)}
                    unreadLabel={t('formSubmissions:unread')}
                    onClick={() => openSubmission(row)}
                  />
                </li>
              ))}
            </ul>
          )}

          {totalPages > 1 && (
            <nav className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="icon-sm"
                disabled={filter.page <= 1}
                aria-label={t('general:previous')}
                onClick={() => setParams({ page: String(filter.page - 1) })}
              >
                <ChevronLeftIcon className="size-4" />
              </Button>
              <span className="text-muted-foreground text-sm">
                {t('formSubmissions:pageOf', {
                  page: String(filter.page),
                  total: String(totalPages)
                })}
              </span>
              <Button
                variant="outline"
                size="icon-sm"
                disabled={filter.page >= totalPages}
                aria-label={t('general:next')}
                onClick={() => setParams({ page: String(filter.page + 1) })}
              >
                <ChevronRightIcon className="size-4" />
              </Button>
            </nav>
          )}

          <Sheet
            open={openRow !== null}
            onOpenChange={(open) => setOpenId(open ? openId : null)}
          >
            {/* The sheet portals to `body`, escaping the `twp` scope above —
                without these it inherits Payload's 13px root and every size
                lands 0.75x too small. Same reason the dropdowns carry them. */}
            <SheetContent
              size="lg"
              className="codeware-admin twp overflow-y-auto"
            >
              {openRow && (
                <>
                  <SheetHeader>
                    <SheetTitle>
                      {openRow.formTitle ?? t('formSubmissions:deletedForm')}
                    </SheetTitle>
                    <SheetDescription>
                      {t('formSubmissions:received', {
                        when: new Date(openRow.receivedAt).toLocaleString(
                          i18n.language
                        )
                      })}
                    </SheetDescription>
                  </SheetHeader>
                  <div className="px-4 pb-6">
                    <SubmissionDetail
                      fields={openRow.fields}
                      emptyLabel={t('formSubmissions:noValues')}
                      orphanedLabel={t('formSubmissions:orphanedField')}
                    />
                  </div>
                </>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </Gutter>
    </div>
  );
};

'use client';

import {
  TourFillBar,
  TourSignupDetail,
  TourSignupRow
} from '@codeware/app-cms/ui/tour-signups';
import type {
  TranslationsKeys,
  TranslationsObject
} from '@codeware/app-cms/util/i18n';
import { Button } from '@codeware/shared/ui/shadcn/components/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@codeware/shared/ui/shadcn/components/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle
} from '@codeware/shared/ui/shadcn/components/sheet';
import { Textarea } from '@codeware/shared/ui/shadcn/components/textarea';
import {
  ArrowDownTrayIcon,
  ArrowUturnLeftIcon,
  Bars2Icon,
  TrashIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import {
  DraggableSortable,
  DraggableSortableItem,
  toast,
  useTranslation
} from '@payloadcms/ui';
import { useRouter } from 'next/navigation';
import React, { useCallback, useMemo, useState } from 'react';

import { usePayloadSdk } from '../utils/use-payload-sdk';

import { reorderQueue } from './reorder-queue';
import type { TourSignupItem, TourSignupsSummary } from './types';

type Props = {
  signups: Array<TourSignupItem>;
  summary: TourSignupsSummary;
  /** Admin UI language, for date formatting */
  language: string;
};

/**
 * The guide's signup workspace: who is on the tour, who is waiting, who left.
 *
 * Three lists rather than one sortable table. They are read for different
 * reasons — the booked list is the passenger list, the queue is a decision
 * about who to call next, and cancellations are history — and a single table
 * sorted by status makes all three worse.
 *
 * Every action writes through Payload's own REST API under the editor's
 * session, so the capacity guard applies here exactly as it does to the site.
 * A refused promotion surfaces the server's message: it names the shortfall,
 * which is the only useful thing to say to someone with a customer waiting.
 */
export const TourSignupsPanel: React.FC<Props> = ({
  signups,
  summary,
  language
}) => {
  const { t } = useTranslation<TranslationsObject, TranslationsKeys>();
  const { sdk, apiRoute } = usePayloadSdk();
  const router = useRouter();

  const [openId, setOpenId] = useState<number | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [purgeOpen, setPurgeOpen] = useState(false);

  /**
   * A refused promotion is the one message here worth interrupting for: the
   * guide usually has the customer on the phone, and the reason names the
   * shortfall. It stays until dismissed rather than timing out unread.
   */
  const reportError = useCallback(
    (message: string) =>
      toast.error(message, { duration: Infinity, closeButton: true }),
    []
  );

  /**
   * Compact enough for a row, and never ambiguous: a signup list is read
   * against "when did they sign up, when did that change", which a bare day
   * and month cannot answer.
   */
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

  /** The detail view answers "when exactly", which a date alone cannot */
  const dateTimeFormat = useMemo(
    () =>
      new Intl.DateTimeFormat(language, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
    [language]
  );

  const formatDate = useCallback(
    (iso: string | null) => (iso ? dateFormat.format(new Date(iso)) : null),
    [dateFormat]
  );

  const formatDateTime = useCallback(
    (iso: string | null) => (iso ? dateTimeFormat.format(new Date(iso)) : null),
    [dateTimeFormat]
  );

  const booked = signups.filter((row) => row.status === 'booked');
  const waiting = [...signups.filter((row) => row.status === 'waiting')].sort(
    // Positions are sparse after promotions, and a legacy row may have none —
    // fall back to arrival so the queue never renders in an arbitrary order
    (a, b) =>
      (a.queuePosition ?? Number.MAX_SAFE_INTEGER) -
        (b.queuePosition ?? Number.MAX_SAFE_INTEGER) ||
      a.signedUpAt.localeCompare(b.signedUpAt)
  );
  const cancelled = signups.filter((row) => row.status === 'cancelled');

  const seatsFree = summary.maxCustomers
    ? Math.max(summary.maxCustomers - summary.booked, 0)
    : 0;

  const openRow = useMemo(
    () => signups.find((row) => row.id === openId) ?? null,
    [signups, openId]
  );

  const rowLabels = useMemo(
    () => ({
      status: {
        booked: t('tourSignups:booked'),
        waiting: t('tourSignups:waiting'),
        cancelled: t('tourSignups:cancelled')
      },
      people: (count: number) =>
        count === 1
          ? t('tourSignups:peopleOne')
          : t('tourSignups:people', { count }),
      signedUp: t('tourSignups:signedUp'),
      anonymized: t('tourSignups:anonymized')
    }),
    [t]
  );

  /** Write a change and let the server view re-read the list */
  const save = useCallback(
    async (id: number, data: Partial<TourSignupItem>) => {
      setBusy(true);
      try {
        await sdk.update({
          collection: 'tour-signups',
          id,
          data
        });
        router.refresh();
      } catch (e) {
        // The guard refuses an overbooking promotion with a message worth
        // reading; anything else falls back to a generic failure
        reportError(
          e instanceof Error ? e.message : t('tourSignups:saveFailed')
        );
      } finally {
        setBusy(false);
      }
    },
    [reportError, router, sdk, t]
  );

  const move = useCallback(
    (from: number, to: number) => {
      const ids = waiting.map((row) => row.id);
      const [moved] = ids.splice(from, 1);
      ids.splice(to, 0, moved);

      setBusy(true);
      void reorderQueue(sdk, summary.tourId, ids)
        .then((ok) => {
          if (!ok) {
            reportError(t('tourSignups:saveFailed'));
            return;
          }
          router.refresh();
        })
        .finally(() => setBusy(false));
    },
    [reportError, router, sdk, summary.tourId, t, waiting]
  );

  const renderRow = (
    row: TourSignupItem,
    dragHandle?: React.ReactNode,
    // The stored position goes sparse between renumbering writes; what the
    // guide needs to read is "who is next", so the queue counts from one
    position?: number
  ) => (
    <TourSignupRow
      key={row.id}
      name={row.name}
      email={row.email}
      phone={row.phone}
      people={row.people}
      status={row.status}
      queuePosition={position ?? row.queuePosition}
      signedUpAt={row.signedUpAt}
      signedUpLabel={formatDate(row.signedUpAt) ?? ''}
      signedUpTitle={t('tourSignups:signedUp')}
      statusChangedLabel={formatDate(row.statusChangedAt)}
      statusChangedTitle={t('tourSignups:statusChanged')}
      anonymized={row.anonymized}
      labels={rowLabels}
      dragHandle={dragHandle}
      onClick={() => {
        setOpenId(row.id);
        setNotes(row.notes ?? '');
      }}
      actions={
        <div className="flex shrink-0 items-center gap-1">
          {row.status !== 'booked' && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => void save(row.id, { status: 'booked' })}
            >
              {row.status === 'waiting'
                ? t('tourSignups:promote')
                : t('tourSignups:restore')}
            </Button>
          )}
          {row.status !== 'cancelled' && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={busy}
              aria-label={t('tourSignups:cancel')}
              title={t('tourSignups:cancel')}
              onClick={() => void save(row.id, { status: 'cancelled' })}
            >
              <XMarkIcon className="size-4" />
            </Button>
          )}
          {row.status === 'cancelled' && (
            <ArrowUturnLeftIcon
              className="text-muted-foreground size-4"
              aria-hidden
            />
          )}
        </div>
      }
    />
  );

  return (
    <div className="codeware-admin twp flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <TourFillBar
          booked={summary.booked}
          maxCustomers={summary.maxCustomers}
          waiting={summary.waiting}
          labels={{
            full: t('tourSignups:full'),
            overbooked: t('tourSignups:overbooked'),
            waiting: (count) => t('tourSignups:waitingCount', { count }),
            summary: t('tourSignups:fillSummary', {
              booked: summary.booked,
              max: summary.maxCustomers ?? summary.booked
            })
          }}
        />
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" asChild>
            <a
              href={`${apiRoute}/tour-signups-export?tour=${summary.tourId}`}
              download
            >
              <ArrowDownTrayIcon className="size-4" />
              {t('tourSignups:export')}
            </a>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy || !signups.length}
            onClick={() => setPurgeOpen(true)}
          >
            <TrashIcon className="size-4" />
            {t('tourSignups:anonymize')}
          </Button>
        </div>
      </div>

      {/* Signups now queue behind anyone already waiting, so a tour can hold
          free seats and a queue at the same time — and only a promotion fills
          them. That is worth saying out loud rather than leaving to arithmetic. */}
      {seatsFree > 0 && waiting.length > 0 && (
        <p className="border-border bg-muted/40 rounded-lg border px-3 py-2 text-sm">
          {t('tourSignups:seatsFreeWithQueue', {
            count: seatsFree,
            name: waiting[0].name
          })}
        </p>
      )}

      {!signups.length && (
        <p className="text-muted-foreground text-sm">
          {t('tourSignups:empty')}
        </p>
      )}

      {booked.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">{t('tourSignups:booked')}</h3>
          <div className="border-border divide-border divide-y rounded-lg border">
            {booked.map((row) => renderRow(row))}
          </div>
        </section>
      )}

      {waiting.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">
            {t('tourSignups:waitingHeading')}
          </h3>
          <p className="text-muted-foreground text-xs">
            {t('tourSignups:reorderHint')}
          </p>
          <div className="border-border divide-border divide-y rounded-lg border">
            <DraggableSortable
              ids={waiting.map((row) => String(row.id))}
              onDragEnd={({ moveFromIndex, moveToIndex }) =>
                move(moveFromIndex, moveToIndex)
              }
            >
              {waiting.map((row, index) => (
                <DraggableSortableItem key={row.id} id={String(row.id)}>
                  {({ attributes, listeners, setNodeRef, transform }) => (
                    <div ref={setNodeRef} style={{ transform }}>
                      {renderRow(
                        row,
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-foreground shrink-0 cursor-grab"
                          aria-label={t('tourSignups:moveUp')}
                          {...attributes}
                          {...listeners}
                        >
                          <Bars2Icon className="size-4" />
                        </button>,
                        index + 1
                      )}
                    </div>
                  )}
                </DraggableSortableItem>
              ))}
            </DraggableSortable>
          </div>
        </section>
      )}

      {cancelled.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="text-muted-foreground text-sm font-semibold">
            {t('tourSignups:cancelled')}
          </h3>
          <div className="border-border divide-border divide-y rounded-lg border">
            {cancelled.map((row) => renderRow(row))}
          </div>
        </section>
      )}

      {/* Irreversible and it removes what a guide may still need on the day,
          so it asks first — in the admin's own visual language rather than the
          browser's, which `window.confirm` cannot be styled into */}
      <Dialog open={purgeOpen} onOpenChange={setPurgeOpen}>
        <DialogContent className="codeware-admin twp">
          <DialogHeader>
            <DialogTitle>{t('tourSignups:anonymize')}</DialogTitle>
            <DialogDescription>
              {t('tourSignups:anonymizeConfirm')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                {t('general:cancel')}
              </Button>
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              disabled={busy}
              onClick={() => {
                setPurgeOpen(false);
                setBusy(true);
                void sdk
                  .request({
                    method: 'POST',
                    path: '/tour-signups-anonymize',
                    json: { tour: summary.tourId }
                  })
                  .then((response) => {
                    if (!response.ok) {
                      reportError(t('tourSignups:saveFailed'));
                      return;
                    }
                    router.refresh();
                  })
                  .finally(() => setBusy(false));
              }}
            >
              {t('tourSignups:anonymize')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet
        open={openRow !== null}
        onOpenChange={(open) => !open && setOpenId(null)}
      >
        {/* Radix portals the sheet to the body, outside the panel's wrapper,
            so the Tailwind scope has to be repeated here or nothing applies */}
        <SheetContent
          side="right"
          size="lg"
          className="codeware-admin twp overflow-y-auto"
        >
          <SheetHeader className="p-6">
            <SheetTitle>
              {openRow?.anonymized
                ? t('tourSignups:anonymized')
                : (openRow?.name ?? '')}
            </SheetTitle>
          </SheetHeader>
          {openRow && (
            <div className="px-6 pb-8">
              <TourSignupDetail
                name={openRow.name}
                email={openRow.email}
                phone={openRow.phone}
                people={openRow.people}
                status={openRow.status}
                queuePosition={
                  openRow.status === 'waiting'
                    ? waiting.findIndex((row) => row.id === openRow.id) + 1
                    : openRow.queuePosition
                }
                signedUpLabel={formatDateTime(openRow.signedUpAt) ?? ''}
                statusChangedLabel={formatDateTime(openRow.statusChangedAt)}
                termsAcceptedLabel={formatDateTime(openRow.termsAcceptedAt)}
                anonymized={openRow.anonymized}
                labels={{
                  name: t('tourSignups:name'),
                  email: t('tourSignups:email'),
                  phone: t('tourSignups:phone'),
                  people: t('tourSignups:partySize'),
                  status: t('tourSignups:status'),
                  queuePosition: t('tourSignups:queuePosition'),
                  signedUp: t('tourSignups:signedUp'),
                  statusChanged: t('tourSignups:statusChanged'),
                  termsAccepted: t('tourSignups:termsAccepted'),
                  statusValue: rowLabels.status,
                  anonymized: t('tourSignups:anonymized'),
                  notes: t('tourSignups:notes')
                }}
                notesField={
                  <div className="flex flex-col items-start gap-2">
                    <Textarea
                      value={notes}
                      rows={4}
                      onChange={(event) => setNotes(event.target.value)}
                    />
                    <Button
                      type="button"
                      size="sm"
                      disabled={busy || notes === (openRow.notes ?? '')}
                      onClick={() => void save(openRow.id, { notes })}
                    >
                      {t('general:save')}
                    </Button>
                  </div>
                }
              />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default TourSignupsPanel;

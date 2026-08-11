import type { ReactNode } from 'react';

import type { TourSignupStatus } from './tour-signup-row';

export type TourSignupDetailProps = {
  name: string;
  email: string;
  phone?: string | null;
  people: number;
  status: TourSignupStatus;
  queuePosition?: number | null;
  /** Pre-formatted timestamps; the panel owns date formatting */
  signedUpLabel: string;
  statusChangedLabel?: string | null;
  termsAcceptedLabel?: string | null;
  anonymized?: boolean;
  labels: {
    name: string;
    email: string;
    phone: string;
    people: string;
    status: string;
    queuePosition: string;
    signedUp: string;
    statusChanged: string;
    termsAccepted: string;
    statusValue: Record<TourSignupStatus, string>;
    anonymized: string;
    notes: string;
  };
  /** Notes editor supplied by the panel — the only editable part */
  notesField?: ReactNode;
};

/**
 * One signup in full, as label/value pairs, with the guide's notes below.
 *
 * Everything but the notes is read-only here. A signup is editable — unlike a
 * form submission — but the moves that matter (promote, cancel) change
 * capacity, so they belong to the panel's buttons where they can be refused
 * with a reason, not to a free-text field.
 *
 * Hook-free so it renders on either side of the client boundary.
 */
export function TourSignupDetail({
  name,
  email,
  phone,
  people,
  status,
  queuePosition,
  signedUpLabel,
  statusChangedLabel,
  termsAcceptedLabel,
  anonymized = false,
  labels,
  notesField
}: TourSignupDetailProps) {
  const rows: Array<[string, string]> = [
    [labels.name, anonymized ? labels.anonymized : name],
    [labels.email, anonymized ? '—' : email],
    [labels.phone, anonymized ? '—' : (phone ?? '—')],
    [labels.people, String(people)],
    [labels.status, labels.statusValue[status]],
    ...(status === 'waiting' && typeof queuePosition === 'number'
      ? ([[labels.queuePosition, `#${queuePosition}`]] as Array<
          [string, string]
        >)
      : []),
    [labels.signedUp, signedUpLabel],
    ...(statusChangedLabel
      ? ([[labels.statusChanged, statusChangedLabel]] as Array<
          [string, string]
        >)
      : []),
    // Absent rather than "—": a signup taken before terms were configured
    // never had anything to accept, and an empty date would read as a refusal
    ...(termsAcceptedLabel
      ? ([[labels.termsAccepted, termsAcceptedLabel]] as Array<
          [string, string]
        >)
      : [])
  ];

  return (
    <div className="flex flex-col gap-6">
      <dl className="divide-border divide-y">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="grid gap-1 py-3 sm:grid-cols-[minmax(0,12rem)_1fr] sm:gap-4"
          >
            <dt className="text-muted-foreground text-sm font-medium">
              {label}
            </dt>
            <dd className="text-foreground text-sm break-words">{value}</dd>
          </div>
        ))}
      </dl>
      {notesField && (
        <div className="flex flex-col gap-2">
          <span className="text-muted-foreground text-sm font-medium">
            {labels.notes}
          </span>
          {notesField}
        </div>
      )}
    </div>
  );
}

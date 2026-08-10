'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

import { markSubmissionsRead } from './mark-submissions-read';
import { useSubmissionsSdk } from './use-submissions-sdk';

type Props = {
  /** Submission to mark; the caller only mounts this when it is unread */
  id: number;
};

/**
 * Marks a submission read when its document view opens.
 *
 * The list view marks on opening the sheet, but the document view is reachable
 * on its own — a direct link, a bookmark, or the back button — and without
 * this a message read that way stays unread in the nav badge and dashboard
 * count.
 *
 * A mounted client component rather than a write inside the server view: a
 * render-time side effect would fire on every re-render, and RSC gives no
 * guarantee about how often that happens.
 */
export function MarkReadOnMount({ id }: Props) {
  const router = useRouter();
  const { sdk } = useSubmissionsSdk();
  // Two separate guards. `inFlight` stops StrictMode's second effect run from
  // duplicating the request; `done` is only set once the server confirms, so a
  // failed call can still be retried when the effect next runs — `sdk` changes
  // as the auth token settles, which is exactly when the first attempt is most
  // likely to have failed.
  const inFlight = useRef(false);
  const done = useRef(false);

  useEffect(() => {
    if (done.current || inFlight.current) {
      return;
    }
    inFlight.current = true;

    void markSubmissionsRead(sdk, [id]).then((updated) => {
      inFlight.current = false;
      if (updated.length) {
        done.current = true;
        // Refresh so the nav badge and dashboard count follow immediately
        router.refresh();
      }
    });
  }, [id, router, sdk]);

  return null;
}

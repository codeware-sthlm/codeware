'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@codeware/shared/ui/shadcn/components/dialog';
import { useState } from 'react';

export type LegalPageDialogProps = {
  /** Path to the page, e.g. `/privacy` */
  url: string;
  /** Link text, also used as the dialog title */
  label: string;
  className?: string;
};

/**
 * Opens a privacy or terms page over the signup form.
 *
 * Reading the terms is a detour from filling in a form, and navigating away
 * costs whatever the customer has already typed. A dialog keeps the form
 * behind it, so closing the page returns them exactly where they were.
 *
 * The page is loaded in a frame rather than fetched and re-rendered: it is the
 * tenant's own page, on the same origin, and it should read exactly as it does
 * when visited directly — including any blocks the editor put on it.
 *
 * Mounted only once opened, so no hidden frame loads a page nobody asked for.
 */
export function LegalPageDialog({
  url,
  label,
  className
}: LegalPageDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" className={className}>
          {label}
        </button>
      </DialogTrigger>
      <DialogContent className="flex h-[90vh] max-w-[min(64rem,95vw)] flex-col gap-0 p-0 sm:max-w-[min(64rem,95vw)]">
        <DialogHeader className="border-border/40 border-b px-6 py-4">
          <DialogTitle>{label}</DialogTitle>
        </DialogHeader>
        {open && (
          <iframe
            src={url}
            title={label}
            // The frame sits on top of a form the customer has just typed
            // their name, email and phone into, and it is same-origin. No
            // block renders author-supplied script today, but if one ever did,
            // a script in here could reach `window.parent` and read all of it.
            // Withholding `allow-scripts` stops that outright — and without
            // `allow-same-origin` the document has an opaque origin anyway.
            // Page content is server-rendered, so it reads fine without JS;
            // `allow-popups` keeps external links in the terms working.
            sandbox="allow-popups"
            className="h-full w-full flex-1 border-0"
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

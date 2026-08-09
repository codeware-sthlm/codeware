'use client';

import { Button } from '@codeware/shared/ui/shadcn/components/button';
import { t } from '@codeware/shared/util/i18n';
import type { Tour } from '@codeware/shared/util/payload-types';
import { CalendarPlusIcon, PrinterIcon, Share2Icon } from 'lucide-react';
import { toast } from 'sonner';

import { usePayload } from '../providers/PayloadProvider';
import { buildTourCalendar } from '../utils/tour-calendar';

type Props = {
  tour: Tour;
};

/** Slug-safe filename for the downloaded calendar entry */
function calendarFilename(slug: string | null | undefined): string {
  return `${slug || 'tour'}.ics`;
}

/**
 * Share, add-to-calendar and print actions for a tour.
 *
 * Hidden when printing — they are page furniture, not part of the document.
 */
export function TourActions({ tour }: Props) {
  const { locale } = usePayload();

  const currentUrl = () =>
    typeof window === 'undefined' ? '' : window.location.href;

  const handleShare = async () => {
    const url = currentUrl();

    // The Web Share API only exists on (mostly mobile) browsers and requires a
    // user gesture; everywhere else fall back to the clipboard
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: tour.title,
          text: tour.summary,
          url
        });
        return;
      } catch {
        // Dismissing the share sheet rejects — never treat that as an error
        return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      toast.success(t(locale, 'tours.shareCopied'));
    } catch {
      toast.error(t(locale, 'tours.shareFailed'));
    }
  };

  const handleCalendar = () => {
    const ics = buildTourCalendar(tour, { url: currentUrl() });
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const href = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = href;
    link.download = calendarFilename(tour.slug);
    link.click();

    // Revoking synchronously can cancel or truncate the download in some
    // browsers — let the current task finish first
    setTimeout(() => URL.revokeObjectURL(href), 0);
  };

  return (
    <div className="flex items-center gap-1 print:hidden">
      <Button
        variant="ghost"
        size="icon"
        onClick={handleShare}
        aria-label={t(locale, 'tours.share')}
        title={t(locale, 'tours.share')}
      >
        <Share2Icon className="size-4" />
      </Button>
      {/* Nothing to put in a calendar until the departure is confirmed */}
      {tour.departureDate && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCalendar}
          aria-label={t(locale, 'tours.addToCalendar')}
          title={t(locale, 'tours.addToCalendar')}
        >
          <CalendarPlusIcon className="size-4" />
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => window.print()}
        aria-label={t(locale, 'tours.print')}
        title={t(locale, 'tours.print')}
      >
        <PrinterIcon className="size-4" />
      </Button>
    </div>
  );
}

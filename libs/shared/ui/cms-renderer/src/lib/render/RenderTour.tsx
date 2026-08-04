'use client';

import { Button } from '@codeware/shared/ui/shadcn/components/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@codeware/shared/ui/shadcn/components/card';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@codeware/shared/ui/shadcn/components/sheet';
import { t } from '@codeware/shared/util/i18n';
import type { Tour } from '@codeware/shared/util/payload-types';
import { CheckIcon, ListOrderedIcon, MinusIcon } from 'lucide-react';
import { useState } from 'react';

import { FormBlock } from '../blocks/FormBlock';
import { ImageBlock } from '../blocks/ImageBlock';
import { RichText } from '../blocks/RichText';
import { Container } from '../layout/Container';
import { usePayload } from '../providers/PayloadProvider';
import {
  formatPrice,
  formatTourDate,
  formatTourDayDate,
  resolveTourHero
} from '../utils/tour-format';

import { TourActions } from './TourActions';
import { TourPlaces } from './TourPlaces';

type RenderTourProps = {
  /**
   * Tour data to render.
   * The app is responsible for fetching this data and handling 404s.
   */
  tour: Tour;
};

/**
 * Framework-agnostic tour renderer.
 *
 * Reads as a product page: destination and title, the hero, then a booking
 * summary carrying the price, the dates and the way in. The page itself stays
 * short — the full day-by-day itinerary and the booking form each open in a
 * sheet, so the page gives an overview rather than the whole brochure.
 *
 * **Usage:**
 * The app is responsible for:
 * - Fetching tour data by slug
 * - Handling 404 cases (if tour is null/undefined)
 * - Providing PayloadProvider context
 */
export function RenderTour({ tour }: RenderTourProps) {
  const { locale, navigate } = usePayload();

  const {
    bookingDeadline,
    bookingForm,
    content,
    currency,
    departureDate,
    departureNote,
    destination,
    duration,
    intent,
    heroImage,
    included,
    itinerary,
    notIncluded,
    price,
    summary,
    title
  } = tour;

  const [bookingOpen, setBookingOpen] = useState(false);
  const hasBookingForm = bookingForm && typeof bookingForm === 'object';

  // A tour with no confirmed departure can only gather interest, so the call to
  // action and the copy around it change with the intent
  const isBooking = intent === 'booking';
  const ctaLabel = isBooking
    ? t(locale, 'tours.bookTour')
    : t(locale, 'tours.registerInterest');
  const ctaLede = isBooking
    ? t(locale, 'tours.bookingLede', {
        date: formatTourDate(bookingDeadline, locale)
      })
    : t(locale, 'tours.interestLede');
  const departureValue =
    formatTourDate(departureDate, locale) ||
    departureNote ||
    t(locale, 'tours.datesToBeConfirmed');
  const hero = resolveTourHero(heroImage);
  const days = itinerary ?? [];

  const facts = [
    { label: t(locale, 'tours.departure'), value: departureValue },
    { label: t(locale, 'tours.duration'), value: duration },
    {
      label: isBooking
        ? t(locale, 'tours.bookBefore')
        : t(locale, 'tours.signUpBefore'),
      value: formatTourDate(bookingDeadline, locale)
    }
  ].filter((fact) => Boolean(fact.value));

  const bookingButton = hasBookingForm && (
    <Sheet open={bookingOpen} onOpenChange={setBookingOpen}>
      <SheetTrigger asChild>
        <Button className="print:hidden">{ctaLabel}</Button>
      </SheetTrigger>
      <SheetContent side="right" size="md" className="overflow-y-auto">
        <SheetHeader className="p-6">
          <SheetTitle className="text-xl font-semibold">{ctaLabel}</SheetTitle>
          <SheetDescription>{ctaLede}</SheetDescription>
        </SheetHeader>
        <div className="px-6 pb-8">
          <FormBlock
            blockType="form"
            form={bookingForm}
            // Close the sheet once the submission is accepted; the confirmation
            // dialog then has the page behind it rather than the open sheet
            onSuccess={() => setBookingOpen(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );

  return (
    <Container className="mt-16 sm:mt-32 print:mt-0">
      <div className="xl:relative">
        <div className="mx-auto max-w-3xl">
          <a
            href="/tours"
            onClick={(e) => {
              e.preventDefault();
              navigate('/tours');
            }}
            aria-label={t(locale, 'tours.backToTours')}
            className="group mb-8 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md ring-1 shadow-zinc-800/5 ring-zinc-900/5 transition lg:absolute lg:-left-5 lg:-mt-2 lg:mb-0 xl:-top-1.5 xl:left-0 xl:mt-0 dark:border dark:border-zinc-700/50 dark:bg-zinc-800 dark:ring-0 dark:ring-white/10 dark:hover:border-zinc-700 dark:hover:ring-white/20 print:hidden"
          >
            <svg
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
              className="h-4 w-4 stroke-zinc-500 transition group-hover:stroke-zinc-700 dark:stroke-zinc-500 dark:group-hover:stroke-zinc-400"
            >
              <path
                d="M7.25 11.25 3.75 8m0 0 3.5-3.25M3.75 8h8.5"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>

          <article>
            <header>
              <div className="flex items-start justify-between gap-4">
                <p className="text-core-link text-sm font-semibold tracking-[0.14em] uppercase">
                  {destination}
                </p>
                <TourActions tour={tour} />
              </div>
              <h1 className="text-core-headline mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
                {title}
              </h1>
              <p className="text-core-base mt-6 text-lg leading-relaxed">
                {summary}
              </p>
            </header>

            {hero && (
              <div className="mt-10 overflow-hidden rounded-2xl print:hidden [&_img]:aspect-16/9 [&_img]:w-full [&_img]:object-cover">
                <ImageBlock media={hero} hideCaption />
              </div>
            )}

            {/* Booking summary — the price, the dates and the way in */}
            <section className="border-core-border/40 bg-card/40 mt-10 rounded-2xl border p-6 sm:p-8">
              <div className="flex flex-wrap items-end justify-between gap-6 print:block">
                <div>
                  <p className="text-core-muted text-sm">
                    {t(locale, 'tours.price')}
                  </p>
                  <p className="text-core-headline mt-1 text-3xl font-semibold tracking-tight">
                    {formatPrice(price, currency, locale)}
                    <span className="text-core-muted ml-2 text-sm font-normal">
                      {t(locale, 'tours.perPerson')}
                    </span>
                  </p>
                </div>
                {bookingButton}
              </div>
              <dl className="border-core-border/40 mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-t pt-6 sm:grid-cols-3">
                {facts.map((fact) => (
                  <div key={fact.label}>
                    <dt className="text-core-muted text-xs tracking-wide uppercase">
                      {fact.label}
                    </dt>
                    <dd className="text-core-headline mt-1 text-sm font-medium">
                      {fact.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>

            {content && <RichText className="mt-12" data={content} />}

            {(!!included?.length || !!notIncluded?.length) && (
              <section className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
                {!!included?.length && (
                  <Card className="bg-card/40 h-full">
                    <CardHeader>
                      <CardTitle className="text-core-headline text-base">
                        {t(locale, 'tours.included')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {included.map((entry, index) => (
                          <li
                            key={entry.id ?? index}
                            className="text-core-base flex gap-2.5 text-sm"
                          >
                            <CheckIcon
                              className="text-core-link mt-0.5 size-4 shrink-0"
                              aria-hidden="true"
                            />
                            {entry.item}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
                {!!notIncluded?.length && (
                  <Card className="bg-card/40 h-full">
                    <CardHeader>
                      <CardTitle className="text-core-headline text-base">
                        {t(locale, 'tours.notIncluded')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {notIncluded.map((entry, index) => (
                          <li
                            key={entry.id ?? index}
                            className="text-core-muted flex gap-2.5 text-sm"
                          >
                            <MinusIcon
                              className="mt-0.5 size-4 shrink-0"
                              aria-hidden="true"
                            />
                            {entry.item}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </section>
            )}

            {!!days.length && (
              <section className="mt-12 print:hidden">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <h2 className="text-core-headline text-2xl font-bold tracking-tight">
                    {t(locale, 'tours.itinerary')}
                  </h2>
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline">
                        <ListOrderedIcon
                          className="size-4"
                          aria-hidden="true"
                        />
                        {t(locale, 'tours.viewItinerary')}
                      </Button>
                    </SheetTrigger>
                    <SheetContent
                      side="right"
                      size="lg"
                      className="overflow-y-auto"
                    >
                      <SheetHeader className="p-6">
                        <SheetTitle className="text-xl font-semibold">
                          {t(locale, 'tours.itinerary')}
                        </SheetTitle>
                        <SheetDescription>{title}</SheetDescription>
                      </SheetHeader>
                      {/* Numbered timeline — the marker carries the day number
                          so entries stay free of repeated labels. `ml-4.5` is
                          half the 2.25rem marker, so its left edge lands on the
                          wrapper padding rather than floating inward. */}
                      <div className="px-6 pb-8">
                        <ol className="border-core-border/40 ml-4.5 space-y-8 border-l pl-8">
                          {days.map((entry, index) => (
                            <li key={entry.id ?? index} className="relative">
                              {/* Marker sits on the rule, vertically centred on
                                the day label rather than the block as a whole */}
                              <span
                                aria-hidden="true"
                                className="border-core-border/40 bg-core-background-content text-core-headline absolute top-0 -left-8 flex size-9 -translate-x-1/2 items-center justify-center rounded-full border text-sm font-semibold"
                              >
                                {index + 1}
                              </span>
                              <div className="flex min-h-9 flex-col justify-center">
                                <h3 className="text-core-headline text-base font-semibold tracking-tight">
                                  {entry.title}
                                </h3>
                                <p className="text-core-muted mt-0.5 text-xs tracking-wide uppercase">
                                  <span className="sr-only">
                                    {t(locale, 'tours.day', {
                                      day: String(index + 1)
                                    })}{' '}
                                  </span>
                                  {formatTourDayDate(
                                    departureDate,
                                    index,
                                    locale
                                  )}
                                </p>
                              </div>
                              {entry.description && (
                                <p className="text-core-base mt-3 text-sm leading-relaxed whitespace-pre-line">
                                  {entry.description}
                                </p>
                              )}
                              <TourPlaces places={entry.places} />
                            </li>
                          ))}
                        </ol>
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>

                {/* Compact overview stays on the page so the shape of the trip
                    is visible (and indexable) without opening the sheet */}
                <ol className="border-core-border/40 divide-core-border/40 mt-6 divide-y rounded-2xl border">
                  {days.map((entry, index) => (
                    <li
                      key={entry.id ?? index}
                      className="flex items-baseline gap-4 px-5 py-3"
                    >
                      <span className="text-core-muted w-16 shrink-0 text-xs tracking-wide uppercase">
                        {t(locale, 'tours.day', { day: String(index + 1) })}
                      </span>
                      <span className="text-core-headline flex-1 text-sm font-medium">
                        {entry.title}
                      </span>
                      {/* Fixed column so every date starts at the same x
                          regardless of how wide the formatted day is */}
                      {departureDate && (
                        <span className="text-core-muted w-20 shrink-0 text-xs">
                          {formatTourDayDate(departureDate, index, locale)}
                        </span>
                      )}
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {!!days.length && (
              /* The sheet unmounts its content while closed, so the printed
                 document needs its own full copy of the agenda */
              <section className="mt-10 hidden print:block">
                <h2 className="text-core-headline text-xl font-bold tracking-tight">
                  {t(locale, 'tours.itinerary')}
                </h2>
                <ol className="mt-6 space-y-6">
                  {days.map((entry, index) => (
                    <li key={entry.id ?? index} className="break-inside-avoid">
                      <p className="text-core-muted text-xs tracking-wide uppercase">
                        {t(locale, 'tours.day', { day: String(index + 1) })}
                        {departureDate &&
                          ` · ${formatTourDayDate(departureDate, index, locale)}`}
                      </p>
                      <h3 className="text-core-headline mt-1 text-base font-semibold tracking-tight">
                        {entry.title}
                      </h3>
                      {entry.description && (
                        <p className="text-core-base mt-1 text-sm leading-relaxed whitespace-pre-line">
                          {entry.description}
                        </p>
                      )}
                      <TourPlaces places={entry.places} />
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {hasBookingForm && (
              <div className="border-core-border/40 mt-12 flex flex-wrap items-center justify-between gap-4 border-t pt-8 print:hidden">
                <p className="text-core-muted text-sm">{ctaLede}</p>
                {bookingButton}
              </div>
            )}
          </article>
        </div>
      </div>
    </Container>
  );
}

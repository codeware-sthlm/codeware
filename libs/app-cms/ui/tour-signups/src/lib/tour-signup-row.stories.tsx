import type { Meta, StoryObj } from '@storybook/react-vite';

import { TourSignupRow } from './tour-signup-row';

const meta = {
  title: 'App CMS/Tour signups/TourSignupRow'
} satisfies Meta;

export default meta;

const labels = {
  status: {
    booked: 'Booked',
    waiting: 'Waiting list',
    cancelled: 'Cancelled'
  },
  people: (count: number) => (count === 1 ? '1 person' : `${count} people`),
  signedUp: 'signed up',
  anonymized: 'Personal data cleared'
};

export const Statuses: StoryObj = {
  render: () => (
    <div className="border-border divide-border w-[46rem] divide-y overflow-hidden rounded-lg border">
      <TourSignupRow
        name="Anna Berg"
        email="anna@example.se"
        phone="+46 70 123 45 67"
        people={2}
        status="booked"
        signedUpAt="2026-08-03T08:00:00.000Z"
        signedUpLabel="3 Aug"
        labels={labels}
      />
      <TourSignupRow
        name="Karl Sundström"
        email="karl@example.se"
        people={4}
        status="waiting"
        queuePosition={1}
        signedUpAt="2026-08-05T09:30:00.000Z"
        signedUpLabel="5 Aug"
        statusChangedLabel="queued 5 Aug"
        labels={labels}
      />
      <TourSignupRow
        name="Lena Marklund"
        email="lena@example.se"
        phone="+46 73 987 65 43"
        people={1}
        status="cancelled"
        signedUpAt="2026-07-28T11:00:00.000Z"
        signedUpLabel="28 Jul"
        statusChangedLabel="cancelled 8 Aug"
        labels={labels}
      />
      <TourSignupRow
        name="Passenger"
        email=""
        people={2}
        status="booked"
        signedUpAt="2025-06-01T11:00:00.000Z"
        signedUpLabel="1 Jun 2025"
        anonymized
        labels={labels}
      />
    </div>
  )
};

export const ReorderedQueue: StoryObj = {
  render: () => (
    <div className="border-border divide-border w-[46rem] divide-y overflow-hidden rounded-lg border">
      {/* The guide has moved a later signup to the front — the arrival dates
          stay put, which is what makes the reordering visible */}
      <TourSignupRow
        name="Lena Marklund"
        email="lena@example.se"
        people={1}
        status="waiting"
        queuePosition={1}
        signedUpAt="2026-08-06T11:00:00.000Z"
        signedUpLabel="6 Aug"
        statusChangedLabel="queued 6 Aug"
        labels={labels}
      />
      <TourSignupRow
        name="Anna Berg"
        email="anna@example.se"
        people={2}
        status="waiting"
        queuePosition={2}
        signedUpAt="2026-08-03T08:00:00.000Z"
        signedUpLabel="3 Aug"
        statusChangedLabel="queued 3 Aug"
        labels={labels}
      />
      <TourSignupRow
        name="Karl Sundström"
        email="karl@example.se"
        people={4}
        status="waiting"
        queuePosition={3}
        signedUpAt="2026-08-05T09:30:00.000Z"
        signedUpLabel="5 Aug"
        statusChangedLabel="queued 5 Aug"
        labels={labels}
      />
    </div>
  )
};

import { Textarea } from '@codeware/shared/ui/shadcn/components/textarea';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { TourSignupDetail } from './tour-signup-detail';

const meta = {
  title: 'App CMS/Tour signups/TourSignupDetail'
} satisfies Meta;

export default meta;

const labels = {
  name: 'Name',
  email: 'Email',
  phone: 'Phone',
  people: 'Party size',
  status: 'Status',
  queuePosition: 'Queue position',
  signedUp: 'Signed up',
  statusChanged: 'Status changed',
  termsAccepted: 'Terms accepted',
  statusValue: {
    booked: 'Booked',
    waiting: 'Waiting list',
    cancelled: 'Cancelled'
  },
  anonymized: 'Personal data cleared',
  notes: 'Notes'
};

export const Queued: StoryObj = {
  render: () => (
    <div className="w-[34rem]">
      <TourSignupDetail
        name="Karl Sundström"
        email="karl@example.se"
        phone="+46 70 123 45 67"
        people={4}
        status="waiting"
        queuePosition={2}
        signedUpLabel="5 Aug 2026, 09:30"
        statusChangedLabel="5 Aug 2026, 09:30"
        termsAcceptedLabel="5 Aug 2026, 09:30"
        labels={labels}
        notesField={
          <Textarea
            defaultValue="Called about a room upgrade — wants to travel with the Berg party."
            rows={3}
          />
        }
      />
    </div>
  )
};

export const Anonymized: StoryObj = {
  render: () => (
    <div className="w-[34rem]">
      {/* Retention has cleared the personal data; the seat history remains */}
      <TourSignupDetail
        name="Anna Berg"
        email="anna@example.se"
        phone="+46 73 987 65 43"
        people={2}
        status="booked"
        signedUpLabel="1 Jun 2025, 14:02"
        statusChangedLabel="1 Jun 2025, 14:02"
        anonymized
        labels={labels}
      />
    </div>
  )
};

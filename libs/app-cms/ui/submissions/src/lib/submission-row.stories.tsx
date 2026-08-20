import { a11yStory } from '@codeware/shared/util/storybook';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { SubmissionRow } from './submission-row';

const meta = {
  title: 'App CMS/Submissions/SubmissionRow'
} satisfies Meta;

export default meta;

export const List: StoryObj = {
  render: () => (
    <div className="border-border divide-border w-[46rem] divide-y overflow-hidden rounded-lg border">
      <SubmissionRow
        formTitle="Booking request"
        preview="Anna Berg · anna@example.se · 4"
        receivedLabel="2 hours ago"
        receivedAt="2026-08-10T07:12:00.000Z"
        read={false}
        unreadLabel="Unread"
      />
      <SubmissionRow
        formTitle="Contact"
        preview="Jonas Lind · Hej, jag undrar om ni har lediga platser i september"
        receivedLabel="yesterday"
        receivedAt="2026-08-09T09:30:00.000Z"
        read
        unreadLabel="Unread"
      />
      <SubmissionRow
        formTitle="Newsletter signup with a form name long enough to truncate"
        preview="someone-with-a-very-long-address@a-rather-long-domain-name.example.com"
        receivedLabel="3 days ago"
        receivedAt="2026-08-07T11:00:00.000Z"
        read
        unreadLabel="Unread"
      />
      <SubmissionRow
        formTitle="Deleted form"
        preview="This message has no values."
        receivedLabel="last week"
        receivedAt="2026-08-03T08:00:00.000Z"
        read={false}
        unreadLabel="Unread"
      />
      <SubmissionRow
        formTitle="Contact"
        preview="Erik Holm · erik@example.se · Hej!"
        receivedLabel="2 weeks ago"
        receivedAt="2026-07-27T10:00:00.000Z"
        read
        unreadLabel="Unread"
        notificationFailed
        notificationFailedLabel="Not delivered"
      />
    </div>
  )
};

export const PayloadAdminLight = a11yStory(List, 'payload-admin', 'light');
export const PayloadAdminDark = a11yStory(List, 'payload-admin', 'dark');
export const ShadcnLight = a11yStory(List, 'shadcn', 'light');
export const ShadcnDark = a11yStory(List, 'shadcn', 'dark');

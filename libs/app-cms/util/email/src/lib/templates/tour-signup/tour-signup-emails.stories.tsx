import type { SupportedLocale } from '@codeware/shared/util/i18n';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { renderCustomerMail } from './customer';
import { renderNotificationMail } from './notification';
import { renderSeatsFreedMail } from './seats-freed';

type Mail = { subject: string; html: string; text: string };

/**
 * Renders a mail the way a client would: inside a document of its own.
 *
 * An email carries its own markup — inline styles, fixed colours, no Tailwind
 * — and dropping it into the Storybook page would let the preview's stylesheet
 * decide how it looks, which is the one thing a mail client never does. The
 * frame is the whole reason this is previewable here at all.
 *
 * The text part is shown below because it is the half nobody looks at and
 * every spam filter does.
 */
const MailPreview = ({ mail }: { mail: Mail }) => (
  <div className="flex w-full max-w-[46rem] flex-col gap-3">
    <div className="border-border rounded-lg border">
      <div className="text-foreground border-border border-b px-4 py-2 text-sm">
        <span className="text-muted-foreground">Subject: </span>
        {mail.subject}
      </div>
      <iframe
        srcDoc={mail.html}
        title={mail.subject}
        className="h-[26rem] w-full rounded-b-lg bg-white"
      />
    </div>
    <details className="text-muted-foreground text-xs">
      <summary className="cursor-pointer">Plain text part</summary>
      <pre className="mt-2 font-mono text-[11px] whitespace-pre-wrap">
        {mail.text}
      </pre>
    </details>
  </div>
);

/** Every mail is written in the workspace's locale, so that is the one control */
type Args = { locale: SupportedLocale };

const meta: Meta<Args> = {
  title: 'App CMS/Emails/Tour signups',
  argTypes: {
    locale: { control: 'radio', options: ['en', 'sv'] }
  },
  args: { locale: 'en' }
};

export default meta;
type Story = StoryObj<Args>;

const customer = {
  customerName: 'Anna Berg',
  tourTitle: 'Barolo & Barbaresco Harvest',
  people: 2,
  departureLabel: '21 September 2027',
  privacyUrl: 'https://titan.example.com/privacy',
  termsUrl: 'https://titan.example.com/terms',
  from: 'Titan Tours'
};

export const Confirmation: Story = {
  name: 'Customer · booked',
  render: ({ locale }) => (
    <MailPreview
      mail={renderCustomerMail({ ...customer, kind: 'booked', locale })}
    />
  )
};

export const WaitingList: Story = {
  name: 'Customer · waiting list',
  render: ({ locale }) => (
    <MailPreview
      mail={renderCustomerMail({ ...customer, kind: 'waiting', locale })}
    />
  )
};

export const Promoted: Story = {
  name: 'Customer · promoted off the queue',
  render: ({ locale }) => (
    <MailPreview
      mail={renderCustomerMail({ ...customer, kind: 'promoted', locale })}
    />
  )
};

/** A departure with no confirmed date drops the row rather than showing a blank */
export const WithoutDeparture: Story = {
  name: 'Customer · booked, no departure date',
  render: ({ locale }) => (
    <MailPreview
      mail={renderCustomerMail({
        ...customer,
        kind: 'booked',
        departureLabel: null,
        locale
      })}
    />
  )
};

/** Names come from a public form, so the template has to survive markup in one */
export const HostileName: Story = {
  name: 'Customer · name containing markup',
  render: ({ locale }) => (
    <MailPreview
      mail={renderCustomerMail({
        ...customer,
        customerName: '<script>alert(1)</script> & co',
        kind: 'booked',
        locale
      })}
    />
  )
};

export const GuideNotification: Story = {
  name: 'Guide · new signup',
  render: ({ locale }) => (
    <MailPreview
      mail={renderNotificationMail({
        locale,
        customerName: 'Anna Berg',
        customerEmail: 'anna@example.se',
        customerPhone: '+46 70 123 45 67',
        tourTitle: customer.tourTitle,
        people: 2,
        queued: false,
        from: customer.from
      })}
    />
  )
};

export const GuideNotificationQueued: Story = {
  name: 'Guide · new signup, queued',
  render: ({ locale }) => (
    <MailPreview
      mail={renderNotificationMail({
        locale,
        customerName: 'Karl Sundström',
        customerEmail: 'karl@example.se',
        customerPhone: null,
        tourTitle: customer.tourTitle,
        people: 4,
        queued: true,
        from: customer.from
      })}
    />
  )
};

/** The party first in line needs more places than are free — the guide's call */
export const GuideSeatsFreed: Story = {
  name: 'Guide · seats freed with a queue',
  render: ({ locale }) => (
    <MailPreview
      mail={renderSeatsFreedMail({
        locale,
        tourTitle: customer.tourTitle,
        seatsFree: 2,
        firstInQueue: 'Karl Sundström',
        firstInQueuePeople: 4,
        tourUrl: 'https://titan.example.com/admin/collections/tours/21',
        from: customer.from
      })}
    />
  )
};

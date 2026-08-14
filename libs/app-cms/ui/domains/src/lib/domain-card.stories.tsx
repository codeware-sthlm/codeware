import { a11yStory } from '@codeware/shared/util/storybook';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { DomainCard, type DomainCardProps } from './domain-card';

const meta = {
  title: 'App CMS/Domains/DomainCard'
} satisfies Meta;

export default meta;

const labels: DomainCardProps['labels'] = {
  active: 'Active',
  pending: 'Waiting for DNS',
  notRequested: 'No certificate yet',
  paused: 'Paused',
  saveFirst: 'Save the workspace to request a certificate for this domain.',
  request: 'Request certificate',
  check: 'Check now',
  remove: 'Remove certificate',
  copyRecord: 'Copy DNS target',
  dnsLede: 'Create this record where the domain’s DNS is managed:',
  apexNote:
    'This is the domain itself rather than a subdomain, so it needs A and AAAA records — a CNAME is not allowed here.',
  secretCorsTag: 'accepted as an origin',
  secretsMissing:
    'Nothing in Infisical points at this domain. A certificate alone does not make the site answer on it — add the url where the app’s deployment secrets live.',
  secretsUnavailable:
    'Infisical could not be read, so it is unknown whether the deployment secrets point at this domain.',
  corsMissing:
    'No secret for this domain is tagged “cors”, so the CMS will refuse requests coming from it.'
};

const base = {
  hostname: 'pr-test.codeware.se',
  app: 'cdwr-cms-pr-477-demo',
  saved: true,
  labels,
  onAction: () => undefined
} satisfies Partial<DomainCardProps>;

const dns = {
  name: '_acme-challenge.pr-test.codeware.se',
  target: 'pr-test.codeware.se.w0608qd.flydns.net.',
  // Fly repeats the record in prose; the card must not print it twice
  instructions:
    'CNAME _acme-challenge.pr-test.codeware.se ⇒ pr-test.codeware.se.w0608qd.flydns.net.'
};

/** The card takes its width from the panel, so the frame only caps it */
const Frame = ({
  children,
  width = 'w-full max-w-160'
}: {
  children: React.ReactNode;
  width?: string;
}) => <div className={`flex flex-col gap-4 ${width}`}>{children}</div>;

/** Every state a domain moves through, top to bottom */
export const Lifecycle: StoryObj = {
  render: () => (
    <Frame>
      <DomainCard {...base} status="not-requested" />
      <DomainCard
        {...base}
        status="pending"
        statusDetail="Awaiting configuration"
        checkedLabel="Checked 14 Aug 22:42"
        dns={dns}
        secrets={{
          secrets: [
            {
              path: '/tenants/demo/apps/cms',
              key: 'CUSTOM_URL',
              isCorsTagged: true
            }
          ],
          hasCors: true,
          unavailable: false
        }}
      />
      <DomainCard
        {...base}
        status="active"
        checkedLabel="Checked 14 Aug 22:44"
        dns={dns}
        secrets={{
          secrets: [
            {
              path: '/tenants/demo/apps/cms',
              key: 'CUSTOM_URL',
              isCorsTagged: true
            },
            {
              path: '/tenants/demo/apps/web',
              key: 'PUBLIC_URL',
              isCorsTagged: false
            }
          ],
          hasCors: true,
          unavailable: false
        }}
      />
    </Frame>
  )
};

/** The states that need saying out loud rather than just waiting */
export const NeedsAttention: StoryObj = {
  render: () => (
    <Frame>
      <DomainCard
        {...base}
        status="paused"
        checkedLabel="Checked 14 Aug 22:42"
        pausedMessage="Let’s Encrypt has paused new attempts for this domain until 15 Aug 08:00. Retrying before then only extends the pause."
      />
      <DomainCard
        {...base}
        status="active"
        checkedLabel="Checked 14 Aug 22:42"
        secrets={{ secrets: [], hasCors: false, unavailable: false }}
      />
      <DomainCard
        {...base}
        status="active"
        checkedLabel="Checked 14 Aug 22:42"
        secrets={{
          secrets: [
            {
              path: '/tenants/demo/apps/web',
              key: 'PUBLIC_URL',
              isCorsTagged: false
            }
          ],
          hasCors: false,
          unavailable: false
        }}
      />
      <DomainCard
        {...base}
        status="pending"
        secrets={{ secrets: [], hasCors: false, unavailable: true }}
      />
      <DomainCard {...base} status="not-requested" saved={false} />
    </Frame>
  )
};

/** An apex domain cannot use a CNAME, so Fly's own wording carries it */
export const ApexDomain: StoryObj = {
  render: () => (
    <Frame>
      <DomainCard
        {...base}
        hostname="codeware.se"
        status="pending"
        statusDetail="Awaiting configuration"
        dns={{
          isApex: true,
          instructions:
            'A codeware.se ⇒ 66.241.125.1\nAAAA codeware.se ⇒ 2a09:8280:1::4:c0de'
        }}
      />
    </Frame>
  )
};

/** Only the button that was pressed spins */
export const Working: StoryObj = {
  render: () => (
    <Frame>
      <DomainCard
        {...base}
        status="not-requested"
        runningAction="request"
        disabled
      />
      <DomainCard
        {...base}
        status="pending"
        statusDetail="Awaiting configuration"
        dns={dns}
        runningAction="check"
        disabled
      />
      <DomainCard {...base} status="active" runningAction="remove" disabled />
    </Frame>
  )
};

/**
 * A narrow field with names too long for one line — where the header, the
 * actions and the dns record each have to wrap or break
 */
export const Narrow: StoryObj = {
  render: () => (
    <Frame width="w-72">
      <DomainCard
        {...base}
        hostname="gallerier-och-utstallningar.kulturhuset-vasterbotten.se"
        app="cdwr-web-kulturhuset-vasterbotten-prod"
        status="pending"
        statusDetail="Awaiting configuration"
        checkedLabel="Checked 14 Aug 22:42"
        dns={{
          name: '_acme-challenge.gallerier-och-utstallningar.kulturhuset-vasterbotten.se',
          target:
            'gallerier-och-utstallningar.kulturhuset-vasterbotten.se.w0608qd.flydns.net.'
        }}
        secrets={{
          secrets: [
            {
              path: '/tenants/kulturhuset-vasterbotten/apps/web',
              key: 'CUSTOM_URL',
              isCorsTagged: true
            }
          ],
          hasCors: true,
          unavailable: false
        }}
      />
    </Frame>
  )
};

export const PayloadAdminLight = a11yStory(Lifecycle, 'payload-admin', 'light');
export const PayloadAdminDark = a11yStory(Lifecycle, 'payload-admin', 'dark');
export const AttentionAdminLight = a11yStory(
  NeedsAttention,
  'payload-admin',
  'light'
);
export const AttentionAdminDark = a11yStory(
  NeedsAttention,
  'payload-admin',
  'dark'
);
export const NarrowAdminLight = a11yStory(Narrow, 'payload-admin', 'light');
export const NarrowAdminDark = a11yStory(Narrow, 'payload-admin', 'dark');
export const ShadcnLight = a11yStory(Lifecycle, 'shadcn', 'light');
export const ShadcnDark = a11yStory(Lifecycle, 'shadcn', 'dark');

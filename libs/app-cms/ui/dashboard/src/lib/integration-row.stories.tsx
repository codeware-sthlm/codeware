import { a11yStory } from '@codeware/shared/util/storybook';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { IntegrationRow } from './integration-row';

const meta = {
  title: 'App CMS/Dashboard/IntegrationRow'
} satisfies Meta;

export default meta;

/** The sheet's list, at the density it renders inside a `SheetContent` */
export const Rows: StoryObj = {
  render: () => (
    <div className="flex w-full max-w-md flex-col">
      <IntegrationRow
        label="Email"
        value="sendgrid"
        notConfiguredLabel="Not set up"
      />
      <IntegrationRow
        label="Error tracking"
        value="sentry"
        notConfiguredLabel="Not set up"
      />
      <IntegrationRow label="File storage" notConfiguredLabel="Not set up" />
    </div>
  )
};

/** Development, where a local catcher is the correct answer rather than a fault */
export const LocalCatcher: StoryObj = {
  render: () => (
    <div className="flex w-full max-w-md flex-col">
      <IntegrationRow
        label="Email"
        value="smtp · localhost"
        notConfiguredLabel="Not set up"
      />
      <IntegrationRow label="Error tracking" notConfiguredLabel="Not set up" />
      <IntegrationRow
        label="File storage"
        value="s3"
        notConfiguredLabel="Not set up"
      />
    </div>
  )
};

export const PayloadAdminLight = a11yStory(Rows, 'payload-admin', 'light');
export const PayloadAdminDark = a11yStory(Rows, 'payload-admin', 'dark');
export const ShadcnLight = a11yStory(Rows, 'shadcn', 'light');
export const ShadcnDark = a11yStory(Rows, 'shadcn', 'dark');

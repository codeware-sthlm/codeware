import { a11yStory } from '@codeware/shared/util/storybook';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/tabs';

const meta = {
  title: 'Shadcn UI/Tabs'
} satisfies Meta;

export default meta;

export const Default: StoryObj = {
  render: () => (
    <Tabs defaultValue="account" className="w-72">
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>
      <TabsContent value="account">
        <p className="text-muted-foreground p-2 text-sm">
          Manage your account details here.
        </p>
      </TabsContent>
      <TabsContent value="password">
        <p className="text-muted-foreground p-2 text-sm">
          Change your password here.
        </p>
      </TabsContent>
      <TabsContent value="settings">
        <p className="text-muted-foreground p-2 text-sm">
          Configure your settings here.
        </p>
      </TabsContent>
    </Tabs>
  )
};

export const ShadcnLight = a11yStory(Default, 'shadcn', 'light');
export const ShadcnDark = a11yStory(Default, 'shadcn', 'dark');
export const PayloadAdminLight = a11yStory(Default, 'payload-admin', 'light');
export const PayloadAdminDark = a11yStory(Default, 'payload-admin', 'dark');
export const SpotlightLight = a11yStory(Default, 'spotlight', 'light');
export const SpotlightDark = a11yStory(Default, 'spotlight', 'dark');
export const CodewareLight = a11yStory(Default, 'codeware', 'light');
export const CodewareDark = a11yStory(Default, 'codeware', 'dark');

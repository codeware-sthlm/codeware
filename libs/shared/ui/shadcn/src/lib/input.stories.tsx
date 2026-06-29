import { a11yStory } from '@codeware/shared/util/storybook';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Input } from './components/input';
import { Label } from './components/label';

const meta = {
  title: 'Shadcn UI/Input'
} satisfies Meta;

export default meta;

export const States: StoryObj = {
  render: () => (
    <div className="flex w-72 flex-col gap-4">
      <Input aria-label="Default" placeholder="Default" />
      <Input aria-label="Disabled" placeholder="Disabled" disabled />
      <Input aria-label="Invalid" placeholder="Invalid" aria-invalid />
    </div>
  )
};

export const Labeled: StoryObj = {
  render: () => (
    <div className="flex w-72 flex-col gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="you@example.com" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="pass">Password</Label>
        <Input id="pass" type="password" placeholder="••••••••" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="disabled">Disabled</Label>
        <Input id="disabled" disabled placeholder="Not editable" />
      </div>
    </div>
  )
};

export const ShadcnLight = a11yStory(States, 'shadcn', 'light');
export const ShadcnDark = a11yStory(States, 'shadcn', 'dark');
export const PayloadAdminLight = a11yStory(States, 'payload-admin', 'light');
export const PayloadAdminDark = a11yStory(States, 'payload-admin', 'dark');
export const SpotlightLight = a11yStory(States, 'spotlight', 'light');
export const SpotlightDark = a11yStory(States, 'spotlight', 'dark');
export const CodewareLight = a11yStory(States, 'codeware', 'light');
export const CodewareDark = a11yStory(States, 'codeware', 'dark');

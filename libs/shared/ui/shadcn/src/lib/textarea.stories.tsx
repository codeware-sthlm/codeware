import { a11yStory } from '@codeware/shared/util/storybook';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Label } from './components/label';
import { Textarea } from './components/textarea';

const meta = {
  title: 'Shadcn UI/Textarea'
} satisfies Meta;

export default meta;

export const States: StoryObj = {
  render: () => (
    <div className="flex w-72 flex-col gap-4">
      <Textarea placeholder="Write something…" rows={3} />
      <Textarea placeholder="Disabled" disabled rows={3} />
    </div>
  )
};

export const Labeled: StoryObj = {
  render: () => (
    <div className="grid w-72 gap-1.5">
      <Label htmlFor="bio">Bio</Label>
      <Textarea id="bio" placeholder="Tell us a bit about yourself…" />
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

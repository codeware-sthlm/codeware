import { a11yStory } from '@codeware/shared/util/storybook';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Label } from './components/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from './components/select';

const meta = {
  title: 'Shadcn UI/Select'
} satisfies Meta;

export default meta;

export const Default: StoryObj = {
  render: () => (
    <div className="flex w-56 flex-col gap-4">
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select a fruit" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
          <SelectItem value="blueberry">Blueberry</SelectItem>
          <SelectItem value="grapes">Grapes</SelectItem>
        </SelectContent>
      </Select>
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder="Disabled" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="x">X</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
};

export const Labeled: StoryObj = {
  render: () => (
    <div className="grid w-56 gap-1.5">
      <Label htmlFor="role">Role</Label>
      <Select>
        <SelectTrigger id="role">
          <SelectValue placeholder="Select a role" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="admin">Admin</SelectItem>
          <SelectItem value="editor">Editor</SelectItem>
          <SelectItem value="viewer">Viewer</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
};

export const ShadcnLight = a11yStory(Labeled, 'shadcn', 'light');
export const ShadcnDark = a11yStory(Labeled, 'shadcn', 'dark');
export const PayloadAdminLight = a11yStory(Labeled, 'payload-admin', 'light');
export const PayloadAdminDark = a11yStory(Labeled, 'payload-admin', 'dark');
export const SpotlightLight = a11yStory(Labeled, 'spotlight', 'light');
export const SpotlightDark = a11yStory(Labeled, 'spotlight', 'dark');
export const CodewareLight = a11yStory(Labeled, 'codeware', 'light');
export const CodewareDark = a11yStory(Labeled, 'codeware', 'dark');

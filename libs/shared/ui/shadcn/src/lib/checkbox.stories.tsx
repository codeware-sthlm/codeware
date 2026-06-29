import { a11yStory } from '@codeware/shared/util/storybook';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Checkbox } from './components/checkbox';
import { Label } from './components/label';

const meta = {
  title: 'Shadcn UI/Checkbox'
} satisfies Meta;

export default meta;

export const Default: StoryObj = {
  render: () => (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Checkbox id="cb1" />
        <Label htmlFor="cb1">Accept terms and conditions</Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="cb2" defaultChecked />
        <Label htmlFor="cb2">Checked by default</Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="cb3" disabled />
        <Label htmlFor="cb3" className="opacity-50">
          Disabled
        </Label>
      </div>
    </div>
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

import { a11yStory } from '@codeware/shared/util/storybook';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Badge } from './components/badge';

const meta = {
  title: 'Shadcn UI/Badge'
} satisfies Meta;

export default meta;

export const BadgeVariants: StoryObj = {
  name: 'Badge',
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge>Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="destructive">Destructive</Badge>
    </div>
  )
};

export const ShadcnLight = a11yStory(BadgeVariants, 'shadcn', 'light');
export const ShadcnDark = a11yStory(BadgeVariants, 'shadcn', 'dark');
export const PayloadAdminLight = a11yStory(
  BadgeVariants,
  'payload-admin',
  'light'
);
export const PayloadAdminDark = a11yStory(
  BadgeVariants,
  'payload-admin',
  'dark'
);
export const SpotlightLight = a11yStory(BadgeVariants, 'spotlight', 'light');
export const SpotlightDark = a11yStory(BadgeVariants, 'spotlight', 'dark');
export const CodewareLight = a11yStory(BadgeVariants, 'codeware', 'light');
export const CodewareDark = a11yStory(BadgeVariants, 'codeware', 'dark');

import { a11yStory } from '@codeware/shared/util/storybook';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { ScrollArea } from './components/scroll-area';

const meta = {
  title: 'Shadcn UI/Scroll Area'
} satisfies Meta;

export default meta;

const TAGS = Array.from({ length: 20 }, (_, i) => `Tag ${i + 1}`);

export const Default: StoryObj = {
  render: () => (
    <ScrollArea className="h-48 w-48 rounded-md border p-3">
      <div className="flex flex-col gap-2">
        {TAGS.map((tag) => (
          <div key={tag} className="text-sm">
            {tag}
          </div>
        ))}
      </div>
    </ScrollArea>
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

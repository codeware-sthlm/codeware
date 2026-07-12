import { a11yStory } from '@codeware/shared/util/storybook';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { toast } from 'sonner';

import { Button } from './button';
import { Toaster } from './sonner';

const meta = {
  title: 'Shadcn/Sonner'
} satisfies Meta;

export default meta;

export const Demo: StoryObj = {
  render: () => (
    <div>
      <Toaster position="bottom-right" />
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() =>
            toast('Event has been created', {
              description: 'Sunday, December 03, 2023 at 9:00 AM'
            })
          }
        >
          Show toast
        </Button>
        <Button
          variant="outline"
          onClick={() => toast.success('Changes saved')}
        >
          Success
        </Button>
        <Button
          variant="outline"
          onClick={() => toast.error('Something went wrong')}
        >
          Error
        </Button>
      </div>
    </div>
  )
};

export const ShadcnLight = a11yStory(Demo, 'shadcn', 'light');
export const ShadcnDark = a11yStory(Demo, 'shadcn', 'dark');
export const PayloadAdminLight = a11yStory(Demo, 'payload-admin', 'light');
export const PayloadAdminDark = a11yStory(Demo, 'payload-admin', 'dark');
export const SpotlightLight = a11yStory(Demo, 'spotlight', 'light');
export const SpotlightDark = a11yStory(Demo, 'spotlight', 'dark');
export const CodewareLight = a11yStory(Demo, 'codeware', 'light');
export const CodewareDark = a11yStory(Demo, 'codeware', 'dark');

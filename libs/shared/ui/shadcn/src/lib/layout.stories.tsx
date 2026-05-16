import type { Meta, StoryObj } from '@storybook/react-vite';

import { AspectRatio } from './components/aspect-ratio';
import { ScrollArea } from './components/scroll-area';
import { Separator } from './components/separator';

const meta = {
  title: 'Shadcn UI/Layout'
} satisfies Meta;

export default meta;

const TAGS = Array.from({ length: 20 }, (_, i) => `Tag ${i + 1}`);

export const SeparatorStory: StoryObj = {
  name: 'Separator',
  render: () => (
    <div className="flex w-72 flex-col gap-4">
      <div>
        <p className="text-sm font-medium">Horizontal</p>
        <Separator className="my-3" />
        <p className="text-muted-foreground text-sm">Content below</p>
      </div>
      <div className="flex h-8 items-center gap-3">
        <span className="text-sm">Left</span>
        <Separator orientation="vertical" />
        <span className="text-sm">Right</span>
      </div>
    </div>
  )
};

export const ScrollAreaStory: StoryObj = {
  name: 'Scroll Area',
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

export const AspectRatioStory: StoryObj = {
  name: 'Aspect Ratio',
  render: () => (
    <div className="w-72">
      <AspectRatio
        ratio={16 / 9}
        className="bg-muted overflow-hidden rounded-md"
      >
        <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
          16 / 9
        </div>
      </AspectRatio>
    </div>
  )
};

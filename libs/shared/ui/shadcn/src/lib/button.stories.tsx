import type { Meta, StoryObj } from '@storybook/react-vite';
import { Download, Loader2, Mail, Plus } from 'lucide-react';

import { Button } from './components/button';

const meta = {
  title: 'Shadcn UI/Button'
} satisfies Meta;

export default meta;

export const Variants: StoryObj = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Button variant="default">Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
      <Button variant="destructive">Destructive</Button>
    </div>
  )
};

export const Sizes: StoryObj = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="icon" aria-label="Add">
        <Plus />
      </Button>
    </div>
  )
};

export const WithIcon: StoryObj = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Button>
        <Mail /> Email
      </Button>
      <Button variant="outline">
        <Download /> Download
      </Button>
      <Button variant="secondary">
        <Plus /> New item
      </Button>
    </div>
  )
};

export const Loading: StoryObj = {
  render: () => (
    <Button disabled>
      <Loader2 className="animate-spin" />
      Saving…
    </Button>
  )
};

export const Disabled: StoryObj = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Button disabled>Default</Button>
      <Button variant="outline" disabled>
        Outline
      </Button>
      <Button variant="secondary" disabled>
        Secondary
      </Button>
    </div>
  )
};

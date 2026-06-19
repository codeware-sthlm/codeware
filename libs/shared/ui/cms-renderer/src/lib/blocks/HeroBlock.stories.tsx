import { a11yStory } from '@codeware/shared/util/storybook';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { HeroBlock } from './HeroBlock';

const meta = {
  title: 'cms-renderer/HeroBlock',
  component: HeroBlock,
  parameters: { layout: 'padded' }
} satisfies Meta<typeof HeroBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

const args: Story['args'] = {
  blockType: 'hero',
  badge: 'Codeware',
  heading: 'Build with the best.',
  lede: 'We design and engineer digital products that help ambitious companies move faster and scale smarter.',
  actions: [
    {
      link: {
        type: 'custom',
        url: '/contact',
        label: 'Get in touch',
        newTab: false
      },
      emphasis: 'primary'
    },
    {
      link: {
        type: 'custom',
        url: '/work',
        label: 'See our work',
        newTab: false
      },
      emphasis: 'secondary'
    }
  ]
};

export const Default: Story = {
  args
};

export const ShadcnLight = a11yStory({ args }, 'shadcn', 'light');
export const ShadcnDark = a11yStory({ args }, 'shadcn', 'dark');
export const PayloadAdminLight = a11yStory({ args }, 'payload-admin', 'light');
export const PayloadAdminDark = a11yStory({ args }, 'payload-admin', 'dark');
export const SpotlightLight = a11yStory({ args }, 'spotlight', 'light');
export const SpotlightDark = a11yStory({ args }, 'spotlight', 'dark');
export const CodewareLight = a11yStory({ args }, 'codeware', 'light');
export const CodewareDark = a11yStory({ args }, 'codeware', 'dark');

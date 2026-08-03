import { a11yStory } from '@codeware/shared/util/storybook';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Footer } from './Footer';

const meta = {
  title: 'cms-renderer/Footer',
  component: Footer,
  parameters: { layout: 'fullscreen' }
} satisfies Meta<typeof Footer>;

export default meta;
type Story = StoryObj<typeof meta>;

const links = [
  { key: '1', label: 'About', newTab: false, url: '/about' },
  { key: '2', label: 'Services', newTab: false, url: '/services' },
  { key: '3', label: 'Blog', newTab: false, url: '/posts' }
];

const contact = [
  { id: '1', platform: 'email' as const, email: 'hello@codeware.se' },
  {
    id: '2',
    platform: 'linkedin' as const,
    url: 'https://linkedin.com/company/codeware'
  },
  { id: '3', platform: 'phone' as const, phone: '+46 70 123 45 67' }
];

/** Untouched settings: navigation links and the default copyright line. */
export const Default: Story = {
  args: {
    footer: {
      appName: 'Codeware Sthlm AB',
      contact: [],
      copyright: null,
      links,
      showVersion: false,
      tagline: null
    }
  }
};

export const Complete: Story = {
  args: {
    footer: {
      appName: 'Codeware Sthlm AB',
      contact,
      copyright: '© {year} Codeware Sthlm AB. All rights reserved.',
      links,
      showVersion: true,
      tagline: 'We build digital products that outlive their launch date.'
    }
  }
};

/** Everything stacks and centers below the `sm` breakpoint. */
export const Mobile: Story = {
  args: Complete.args,
  globals: { viewport: { value: 'mobile1', isRotated: false } }
};

/** Single page site: no links, just the copyright line. */
export const CopyrightOnly: Story = {
  args: {
    footer: {
      appName: 'Codeware Sthlm AB',
      contact: [],
      copyright: null,
      links: [],
      showVersion: false,
      tagline: null
    }
  }
};

export const ShadcnLight = a11yStory(
  { args: Complete.args },
  'shadcn',
  'light'
);

export const ShadcnDark = a11yStory({ args: Complete.args }, 'shadcn', 'dark');

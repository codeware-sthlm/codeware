import { a11yStory } from '@codeware/shared/util/storybook';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { IconPicker, type IconPickerIcon } from './IconPicker';

const meta = {
  title: 'Shared UI/IconPicker'
} satisfies Meta;

export default meta;

export const Default: StoryObj = {
  render: () => {
    const [icon, setIcon] = useState<IconPickerIcon | undefined>(undefined);
    return (
      <div className="flex flex-col gap-4">
        <IconPicker value={icon} onChange={setIcon} />
        <p className="text-muted-foreground text-sm">
          Selected: {icon ?? 'none'}
        </p>
      </div>
    );
  }
};

export const WithPreselected: StoryObj = {
  name: 'Pre-selected icon',
  render: () => {
    const [icon, setIcon] = useState<IconPickerIcon | undefined>('StarIcon');
    return (
      <div className="flex flex-col gap-4">
        <IconPicker value={icon} onChange={setIcon} />
        <p className="text-muted-foreground text-sm">
          Selected: {icon ?? 'none'}
        </p>
      </div>
    );
  }
};

export const WithColor: StoryObj = {
  name: 'Colored icon',
  render: () => {
    const [icon, setIcon] = useState<IconPickerIcon | undefined>('BoltIcon');
    return <IconPicker value={icon} onChange={setIcon} color="amber-500" />;
  }
};

export const CustomLabels: StoryObj = {
  name: 'Custom labels',
  render: () => {
    const [icon, setIcon] = useState<IconPickerIcon | undefined>(undefined);
    return (
      <IconPicker
        value={icon}
        onChange={setIcon}
        labels={{
          dialogTitle: 'Pick an icon',
          dialogDescription: 'Search and select a Heroicon',
          searchFieldPlaceholder: 'Filter icons…',
          noIconsFound: 'No icons match',
          searchClearButton: 'Reset'
        }}
        trigger={{ labelSelect: 'Choose icon' }}
      />
    );
  }
};

export const ShadcnLight = a11yStory(Default, 'shadcn', 'light');
export const ShadcnDark = a11yStory(Default, 'shadcn', 'dark');
export const PayloadAdminLight = a11yStory(Default, 'payload-admin', 'light');
export const PayloadAdminDark = a11yStory(Default, 'payload-admin', 'dark');
export const SpotlightLight = a11yStory(Default, 'spotlight', 'light');
export const SpotlightDark = a11yStory(Default, 'spotlight', 'dark');
export const CodewareLight = a11yStory(Default, 'codeware', 'light');
export const CodewareDark = a11yStory(Default, 'codeware', 'dark');

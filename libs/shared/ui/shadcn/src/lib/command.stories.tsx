import { a11yStory } from '@codeware/shared/util/storybook';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Calculator,
  Calendar,
  CreditCard,
  Settings,
  Smile,
  User
} from 'lucide-react';

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut
} from './components/command';

const meta = {
  title: 'Shadcn UI/Command'
} satisfies Meta;

export default meta;

export const Default: StoryObj = {
  render: () => (
    <Command className="w-64 rounded-lg border shadow-md">
      <CommandInput placeholder="Type a command or search…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Suggestions">
          <CommandItem>
            <Calendar />
            Calendar
          </CommandItem>
          <CommandItem>
            <Smile />
            Search emoji
          </CommandItem>
          <CommandItem>
            <Calculator />
            Calculator
          </CommandItem>
        </CommandGroup>
        <CommandSeparator aria-hidden="true" />
        <CommandGroup heading="Settings">
          <CommandItem>
            <User />
            Profile
            <CommandShortcut>⌘P</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <CreditCard />
            Billing
            <CommandShortcut>⌘B</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <Settings />
            Settings
            <CommandShortcut>⌘S</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
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

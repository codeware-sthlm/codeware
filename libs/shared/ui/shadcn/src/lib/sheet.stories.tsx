import { a11yStory } from '@codeware/shared/util/storybook';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from './components/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from './components/sheet';

const meta = {
  title: 'Shadcn UI/Sheet'
} satisfies Meta;

export default meta;

export const Default: StoryObj = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open sheet</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit profile</SheetTitle>
          <SheetDescription>
            Make changes to your profile here. Click save when done.
          </SheetDescription>
        </SheetHeader>
        <SheetFooter>
          <Button type="submit">Save changes</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
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

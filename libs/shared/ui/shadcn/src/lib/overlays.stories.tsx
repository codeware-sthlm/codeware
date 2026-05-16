import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChevronRight, LogOut, Settings, User } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from './components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger
} from './components/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger
} from './components/popover';
import { Toaster } from './components/sonner';

const meta = {
  title: 'Shadcn UI/Overlays'
} satisfies Meta;

export default meta;

export const PopoverStory: StoryObj = {
  name: 'Popover',
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Open popover</Button>
      </PopoverTrigger>
      <PopoverContent className="w-72">
        <PopoverHeader>
          <PopoverTitle>Dimensions</PopoverTitle>
          <PopoverDescription>
            Set the dimensions for the layer.
          </PopoverDescription>
        </PopoverHeader>
      </PopoverContent>
    </Popover>
  )
};

export const DropdownMenuStory: StoryObj = {
  name: 'Dropdown Menu',
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Open menu</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48">
        <DropdownMenuLabel>My account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <User />
            Profile
            <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings />
            Settings
            <DropdownMenuShortcut>⌘,</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">
          <LogOut />
          Log out
          <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
};

export const ToasterStory: StoryObj = {
  name: 'Sonner (Toast)',
  render: () => (
    <>
      <Toaster />
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={() => toast('Event has been created')}
        >
          Default
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            toast.success('Changes saved', {
              description: 'Your profile has been updated.'
            })
          }
        >
          Success
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            toast.error('Something went wrong', {
              description: 'Please try again later.'
            })
          }
        >
          Error
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            toast('File uploaded', {
              action: { label: 'Undo', onClick: () => {} }
            })
          }
        >
          With action
        </Button>
      </div>
    </>
  )
};

import type { Meta, StoryObj } from '@storybook/react-vite';
import { Settings } from 'lucide-react';

import { Button } from './components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from './components/dialog';
import { Input } from './components/input';
import { Label } from './components/label';

const meta = {
  title: 'Shadcn UI/Dialog'
} satisfies Meta;

export default meta;

export const Basic: StoryObj = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Open dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you sure?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. The item will be permanently deleted.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline">Cancel</Button>
          <Button variant="destructive">Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
};

export const WithForm: StoryObj = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <Settings /> Edit settings
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <Label htmlFor="dialog-name">Name</Label>
            <Input id="dialog-name" defaultValue="Jane Doe" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="dialog-email">Email</Label>
            <Input id="dialog-email" defaultValue="jane@example.com" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" type="submit">
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
};

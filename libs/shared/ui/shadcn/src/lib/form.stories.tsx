import { a11yStory } from '@codeware/shared/util/storybook';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from './components/button';
import { Checkbox } from './components/checkbox';
import { Input } from './components/input';
import { Label } from './components/label';
import { RadioGroup, RadioGroupItem } from './components/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from './components/select';
import { Textarea } from './components/textarea';

const meta = {
  title: 'Shadcn UI/Form'
} satisfies Meta;

export default meta;

export const InputField: StoryObj = {
  name: 'Input',
  render: () => (
    <div className="flex w-72 flex-col gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="you@example.com" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="pass">Password</Label>
        <Input id="pass" type="password" placeholder="••••••••" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="disabled">Disabled</Label>
        <Input id="disabled" disabled placeholder="Not editable" />
      </div>
    </div>
  )
};

export const TextareaField: StoryObj = {
  name: 'Textarea',
  render: () => (
    <div className="grid w-72 gap-1.5">
      <Label htmlFor="bio">Bio</Label>
      <Textarea id="bio" placeholder="Tell us a bit about yourself…" />
    </div>
  )
};

export const CheckboxField: StoryObj = {
  name: 'Checkbox',
  render: () => (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Checkbox id="terms" defaultChecked />
        <Label htmlFor="terms">Accept terms and conditions</Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="newsletter" />
        <Label htmlFor="newsletter">Subscribe to newsletter</Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="disabled" disabled />
        <Label htmlFor="disabled" className="opacity-50">
          Disabled option
        </Label>
      </div>
    </div>
  )
};

export const RadioGroupField: StoryObj = {
  name: 'Radio group',
  render: () => (
    <RadioGroup defaultValue="option-a">
      <div className="flex items-center gap-2">
        <RadioGroupItem value="option-a" id="option-a" />
        <Label htmlFor="option-a">Option A</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="option-b" id="option-b" />
        <Label htmlFor="option-b">Option B</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="option-c" id="option-c" />
        <Label htmlFor="option-c">Option C</Label>
      </div>
    </RadioGroup>
  )
};

export const SelectField: StoryObj = {
  name: 'Select',
  render: () => (
    <div className="grid w-56 gap-1.5">
      <Label htmlFor="role">Role</Label>
      <Select>
        <SelectTrigger id="role">
          <SelectValue placeholder="Select a role" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="admin">Admin</SelectItem>
          <SelectItem value="editor">Editor</SelectItem>
          <SelectItem value="viewer">Viewer</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
};

export const FullForm: StoryObj = {
  name: 'Composed form',
  render: () => (
    <form className="flex w-80 flex-col gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="name">Name</Label>
        <Input id="name" placeholder="Jane Doe" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="role2">Role</Label>
        <Select>
          <SelectTrigger id="role2">
            <SelectValue placeholder="Pick a role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="editor">Editor</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" placeholder="Optional…" />
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="active" defaultChecked />
        <Label htmlFor="active">Active account</Label>
      </div>
      <Button type="submit">Save</Button>
    </form>
  )
};

export const ShadcnLight = a11yStory(InputField, 'shadcn', 'light');
export const ShadcnDark = a11yStory(InputField, 'shadcn', 'dark');
export const PayloadAdminLight = a11yStory(
  InputField,
  'payload-admin',
  'light'
);
export const PayloadAdminDark = a11yStory(InputField, 'payload-admin', 'dark');
export const SpotlightLight = a11yStory(InputField, 'spotlight', 'light');
export const SpotlightDark = a11yStory(InputField, 'spotlight', 'dark');
export const CodewareLight = a11yStory(InputField, 'codeware', 'light');
export const CodewareDark = a11yStory(InputField, 'codeware', 'dark');

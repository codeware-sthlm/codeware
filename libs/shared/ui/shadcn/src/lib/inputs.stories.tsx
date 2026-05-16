import type { Meta, StoryObj } from '@storybook/react-vite';
import { Search } from 'lucide-react';

import { Button } from './components/button';
import { Checkbox } from './components/checkbox';
import { Input } from './components/input';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText
} from './components/input-group';
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
  title: 'Shadcn UI/Inputs'
} satisfies Meta;

export default meta;

export const TextInput: StoryObj = {
  name: 'Input',
  render: () => (
    <div className="flex w-72 flex-col gap-4">
      <Input placeholder="Default" />
      <Input placeholder="Disabled" disabled />
      <Input placeholder="Invalid" aria-invalid />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="labeled">Email</Label>
        <Input id="labeled" type="email" placeholder="you@example.com" />
      </div>
    </div>
  )
};

export const TextareaInput: StoryObj = {
  name: 'Textarea',
  render: () => (
    <div className="flex w-72 flex-col gap-4">
      <Textarea placeholder="Write something…" rows={3} />
      <Textarea placeholder="Disabled" disabled rows={3} />
    </div>
  )
};

export const CheckboxInput: StoryObj = {
  name: 'Checkbox',
  render: () => (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Checkbox id="cb1" />
        <Label htmlFor="cb1">Accept terms and conditions</Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="cb2" defaultChecked />
        <Label htmlFor="cb2">Checked by default</Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="cb3" disabled />
        <Label htmlFor="cb3" className="opacity-50">
          Disabled
        </Label>
      </div>
    </div>
  )
};

export const RadioGroupInput: StoryObj = {
  name: 'Radio Group',
  render: () => (
    <RadioGroup defaultValue="option-1">
      <div className="flex items-center gap-2">
        <RadioGroupItem value="option-1" id="r1" />
        <Label htmlFor="r1">Option 1</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="option-2" id="r2" />
        <Label htmlFor="r2">Option 2</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="option-3" id="r3" disabled />
        <Label htmlFor="r3" className="opacity-50">
          Option 3 (disabled)
        </Label>
      </div>
    </RadioGroup>
  )
};

export const SelectInput: StoryObj = {
  name: 'Select',
  render: () => (
    <div className="flex w-56 flex-col gap-4">
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select a fruit" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
          <SelectItem value="blueberry">Blueberry</SelectItem>
          <SelectItem value="grapes">Grapes</SelectItem>
        </SelectContent>
      </Select>
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder="Disabled" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="x">X</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
};

export const InputGroupStory: StoryObj = {
  name: 'Input Group',
  render: () => (
    <div className="flex w-72 flex-col gap-4">
      <InputGroup>
        <InputGroupAddon>
          <InputGroupText>https://</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput placeholder="example.com" />
      </InputGroup>
      <InputGroup>
        <InputGroupInput placeholder="Search…" />
        <InputGroupAddon>
          <InputGroupButton>
            <Button size="sm" variant="ghost">
              <Search className="size-4" />
            </Button>
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>
  )
};

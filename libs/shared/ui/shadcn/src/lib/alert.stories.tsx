import type { Meta, StoryObj } from '@storybook/react-vite';
import { AlertTriangle, Info } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from './components/alert';
import { Button } from './components/button';
import { Separator } from './components/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from './components/tooltip';

const meta = {
  title: 'Shadcn UI/Alert & Tooltip'
} satisfies Meta;

export default meta;

export const AlertDefault: StoryObj = {
  name: 'Alert — default',
  render: () => (
    <Alert>
      <Info className="size-4" />
      <AlertTitle>Heads up</AlertTitle>
      <AlertDescription>
        You can add components to your app using the CLI.
      </AlertDescription>
    </Alert>
  )
};

export const AlertDestructive: StoryObj = {
  name: 'Alert — destructive',
  render: () => (
    <Alert variant="destructive">
      <AlertTriangle className="size-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        Your session has expired. Please log in again.
      </AlertDescription>
    </Alert>
  )
};

export const AlertNoIcon: StoryObj = {
  name: 'Alert — no icon',
  render: () => (
    <Alert>
      <AlertTitle>Note</AlertTitle>
      <AlertDescription>
        Without an icon the content spans the full width.
      </AlertDescription>
    </Alert>
  )
};

export const TooltipBasic: StoryObj = {
  name: 'Tooltip',
  render: () => (
    <TooltipProvider>
      <div className="flex items-center gap-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline">Hover me</Button>
          </TooltipTrigger>
          <TooltipContent>Tooltip content</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-8" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Info">
              <Info className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>More information</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
};

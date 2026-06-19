import { a11yStory } from '@codeware/shared/util/storybook';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from './components/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from './components/card';

const meta = {
  title: 'Shadcn UI/Card'
} satisfies Meta;

export default meta;

export const Simple: StoryObj = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Card title</CardTitle>
        <CardDescription>Supporting description text.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">
          Card body content goes here.
        </p>
      </CardContent>
    </Card>
  )
};

export const WithFooter: StoryObj = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Confirm deletion</CardTitle>
        <CardDescription>This action cannot be undone.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">
          All associated data will be permanently removed from our servers.
        </p>
      </CardContent>
      <CardFooter className="gap-2">
        <Button variant="destructive">Delete</Button>
        <Button variant="outline">Cancel</Button>
      </CardFooter>
    </Card>
  )
};

export const WithAction: StoryObj = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Monthly usage</CardTitle>
        <CardDescription>January 2025</CardDescription>
        <CardAction>
          <Button variant="ghost" size="sm">
            View all
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">12,430</p>
        <p className="text-muted-foreground mt-1 text-xs">
          requests this month
        </p>
      </CardContent>
    </Card>
  )
};

export const ShadcnLight = a11yStory(Simple, 'shadcn', 'light');
export const ShadcnDark = a11yStory(Simple, 'shadcn', 'dark');
export const PayloadAdminLight = a11yStory(Simple, 'payload-admin', 'light');
export const PayloadAdminDark = a11yStory(Simple, 'payload-admin', 'dark');
export const SpotlightLight = a11yStory(Simple, 'spotlight', 'light');
export const SpotlightDark = a11yStory(Simple, 'spotlight', 'dark');
export const CodewareLight = a11yStory(Simple, 'codeware', 'light');
export const CodewareDark = a11yStory(Simple, 'codeware', 'dark');

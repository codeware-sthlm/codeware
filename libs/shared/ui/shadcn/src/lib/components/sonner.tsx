'use client';

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon
} from 'lucide-react';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

const Toaster = ({ theme = 'system', ...props }: ToasterProps) => {
  return (
    <Sonner
      theme={theme}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4 text-green-600" />,
        info: <InfoIcon className="size-4 text-blue-500" />,
        warning: <TriangleAlertIcon className="size-4 text-amber-500" />,
        error: <OctagonXIcon className="text-destructive size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />
      }}
      style={
        {
          '--normal-bg': 'var(--card)',
          '--normal-text': 'var(--card-foreground)',
          '--normal-border': 'var(--border)',
          '--success-bg': 'var(--card)',
          '--success-text': 'var(--card-foreground)',
          '--success-border': 'var(--border)',
          '--error-bg': 'var(--card)',
          '--error-text': 'var(--card-foreground)',
          '--error-border': 'var(--border)',
          '--warning-bg': 'var(--card)',
          '--warning-text': 'var(--card-foreground)',
          '--warning-border': 'var(--border)',
          '--border-radius': 'var(--radius)'
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };

import { PayloadProvider } from '@codeware/shared/ui/cms-renderer';
import { cdwrCloudSvg } from '@codeware/shared/ui/primitives';
import type { Decorator, Preview } from '@storybook/react-vite';
import { useEffect } from 'react';

import './preview.css';
import {
  STORYBOOK_THEMES,
  type SbTheme,
  THEME_DARK_STRATEGIES
} from './themes-meta';

const CLASS_DARK_THEMES = new Set(
  STORYBOOK_THEMES.filter((t) => THEME_DARK_STRATEGIES[t] === 'class')
);

const withPayload: Decorator = (Story, context) => {
  const theme = (context.globals['theme'] as 'light' | 'dark') ?? 'light';

  return (
    <PayloadProvider
      value={{
        getCurrentPath: () => window.location.pathname,
        iconConfig: { source: 'svg', svgCode: cdwrCloudSvg },
        navigate: (path, newTab) => {
          if (newTab) {
            window.open(path, '_blank', 'noreferrer');
          } else {
            window.location.href = path;
          }
        },
        payloadUrl: 'http://localhost:3000',
        submitForm: async () => ({
          success: false,
          data: { error: 'Not implemented in Storybook' }
        }),
        setTheme: () => undefined,
        theme,
        resolvedTheme: theme,
        locale: 'en'
      }}
    >
      <Story />
    </PayloadProvider>
  );
};

const withTheme: Decorator = (Story, context) => {
  const theme = (context.globals['theme'] as string) ?? 'light';
  const sbTheme = (context.globals['sbTheme'] as SbTheme) ?? 'payload-admin';
  const usesClassDark = CLASS_DARK_THEMES.has(sbTheme);

  // Mirror theme onto document.body so portaled content (dialogs etc.) inherits it.
  // useEffect ensures cleanup on story unmount so state doesn't leak between stories.
  useEffect(() => {
    const prevSbTheme = document.body.getAttribute('data-sb-theme');
    const prevDataTheme = document.body.getAttribute('data-theme');
    const prevHadDark = document.body.classList.contains('dark');

    document.body.setAttribute('data-sb-theme', sbTheme);
    if (usesClassDark) {
      document.body.removeAttribute('data-theme');
      document.body.classList.toggle('dark', theme === 'dark');
    } else {
      document.body.setAttribute('data-theme', theme);
      document.body.classList.remove('dark');
    }

    return () => {
      if (prevSbTheme) {
        document.body.setAttribute('data-sb-theme', prevSbTheme);
      } else {
        document.body.removeAttribute('data-sb-theme');
      }
      if (prevDataTheme) {
        document.body.setAttribute('data-theme', prevDataTheme);
      } else {
        document.body.removeAttribute('data-theme');
      }
      document.body.classList.toggle('dark', prevHadDark);
    };
  }, [theme, sbTheme, usesClassDark]);

  return (
    <div
      data-theme={usesClassDark ? undefined : theme}
      data-sb-theme={sbTheme}
      className={[
        'twp bg-background p-6',
        usesClassDark && theme === 'dark' ? 'dark' : ''
      ].join(' ')}
    >
      <Story />
    </div>
  );
};

const preview: Preview = {
  globalTypes: {
    sbTheme: {
      description: 'App theme',
      defaultValue: STORYBOOK_THEMES[0],
      toolbar: {
        title: 'App Theme',
        icon: 'paintbrush',
        items: [
          { value: 'shadcn', title: 'shadcn (reference)' },
          { value: 'payload-admin', title: 'Payload Admin' },
          { value: 'spotlight', title: 'Spotlight' },
          { value: 'codeware', title: 'Codeware' }
        ],
        dynamicTitle: true
      }
    },
    theme: {
      description: 'Color theme',
      defaultValue: 'light',
      toolbar: {
        title: 'Color Theme',
        icon: 'circlehollow',
        items: [
          { value: 'light', icon: 'sun', title: 'Light' },
          { value: 'dark', icon: 'moon', title: 'Dark' }
        ],
        dynamicTitle: true
      }
    }
  },
  decorators: [withTheme, withPayload],
  parameters: {
    backgrounds: { disable: true },

    docs: {
      toc: true
    },

    options: {
      storySort: {
        order: [
          'Introduction',
          'Theme',
          'Shadcn',
          'Shared UI',
          'CMS Renderer',
          'cms-renderer',
          'app-cms',
          '*'
        ]
      }
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo'
    }
  },
  tags: ['autodocs']
};

export default preview;

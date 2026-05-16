import type { Decorator, Preview } from '@storybook/react-vite';

import './preview.css';

// Themes that use .dark class strategy instead of [data-theme=dark] attribute
const CLASS_DARK_THEMES = new Set(['spotlight', 'codeware']);

const withTheme: Decorator = (Story, context) => {
  const theme = (context.globals['theme'] as string) ?? 'light';
  const sbTheme = (context.globals['sbTheme'] as string) ?? 'payload-admin';
  const usesClassDark = CLASS_DARK_THEMES.has(sbTheme);

  // Mirror theme onto document.body so portaled content (dialogs etc.) inherits it
  document.body.setAttribute('data-sb-theme', sbTheme);
  if (usesClassDark) {
    document.body.removeAttribute('data-theme');
    document.body.classList.toggle('dark', theme === 'dark');
  } else {
    document.body.setAttribute('data-theme', theme);
    document.body.classList.remove('dark');
  }

  return (
    <div
      data-theme={usesClassDark ? undefined : theme}
      data-sb-theme={sbTheme}
      className={`twp bg-background p-6${usesClassDark && theme === 'dark' ? 'dark' : ''}`}
    >
      <Story />
    </div>
  );
};

const preview: Preview = {
  globalTypes: {
    sbTheme: {
      description: 'App theme',
      defaultValue: 'payload-admin',
      toolbar: {
        title: 'App Theme',
        icon: 'paintbrush',
        items: [
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
  decorators: [withTheme],
  parameters: {
    backgrounds: { disable: true },

    docs: {
      toc: true
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

import { DEFAULT_RECIPE, buildThemeTokens } from '@codeware/shared/util/color';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { previewCss, previewScope } from './preview-css';
import { ThemePreview } from './ThemePreview';
import { ThemeStudio } from './ThemeStudio';

const meta = {
  title: 'Shared UI/Theme Studio',
  parameters: {
    layout: 'fullscreen'
  }
} satisfies Meta;

export default meta;

export const Studio: StoryObj = {
  name: 'Interactive Studio',
  render: () => <ThemeStudio />
};

export const Editing: StoryObj = {
  name: 'Opened on an existing recipe',
  render: () => (
    <ThemeStudio
      recipe={{
        baseFamily: 'slate',
        brandFamily: 'teal',
        surface: 'flat',
        radius: '1rem',
        linkShade: { light: '700', dark: '300' },
        fontBody: 'inter',
        fontHeading: 'system'
      }}
    />
  )
};

/**
 * The preview surface on its own, both schemes side by side.
 *
 * Shows the scoping the studio relies on: the dark pane carries the `.dark`
 * class itself, so it inverts without anything being set on `<html>`.
 */
export const Preview: StoryObj = {
  name: 'Preview panes',
  render: () => {
    const { light, dark } = buildThemeTokens({
      ...DEFAULT_RECIPE,
      brandFamily: 'blue'
    });
    const ids = previewScope('story');

    return (
      <div className="grid gap-4 p-5 lg:grid-cols-2">
        <style>{previewCss('story', light, dark)}</style>
        <ThemePreview id={ids.light} />
        <ThemePreview id={ids.dark} dark />
      </div>
    );
  }
};

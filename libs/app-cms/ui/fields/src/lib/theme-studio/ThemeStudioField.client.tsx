'use client';

import {
  ThemeStudio,
  type ThemeStudioResult
} from '@codeware/shared/ui/theme-studio';
import {
  DEFAULT_RECIPE,
  type ThemeRecipe,
  type ThemeTokens
} from '@codeware/shared/util/color';
import { Button, FieldLabel, useField } from '@payloadcms/ui';
import type { JSONFieldClientProps } from 'payload';
import { useState } from 'react';
import { createPortal } from 'react-dom';

type Overrides = { light: ThemeTokens; dark: ThemeTokens };

const NO_OVERRIDES: Overrides = { light: {}, dark: {} };

/** Payload types a `json` field as anything JSON can hold. */
const asRecipe = (value: unknown): ThemeRecipe | undefined =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as ThemeRecipe)
    : undefined;

const asOverrides = (value: unknown): Overrides =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? { ...NO_OVERRIDES, ...(value as Partial<Overrides>) }
    : NO_OVERRIDES;

/**
 * Opens the theme studio and writes back everything it produces.
 *
 * The recipe is stored alongside the tokens rather than derived from them: a
 * token map cannot be reversed into the four decisions that made it, so
 * without it a theme could be edited once and never reopened where it was left.
 *
 * Sits on the `recipe` field and writes to `tokensLight`, `tokensDark` and
 * `overrides` beside it — those are what the site renders, so the studio owns
 * all four together or none of them.
 */
export const ThemeStudioField: React.FC<JSONFieldClientProps> = ({
  field,
  path,
  readOnly
}) => {
  const { value, setValue } = useField<unknown>({ path });
  const { setValue: setOverrides, value: overridesValue } = useField<unknown>({
    path: 'overrides'
  });
  const { setValue: setLight } = useField<unknown>({ path: 'tokensLight' });
  const { setValue: setDark } = useField<unknown>({ path: 'tokensDark' });

  const [open, setOpen] = useState(false);

  const recipe = asRecipe(value);
  const summary = recipe ?? DEFAULT_RECIPE;

  const onSelect = ({
    recipe: chosen,
    overrides,
    tokensLight,
    tokensDark
  }: ThemeStudioResult) => {
    setValue(chosen);
    setOverrides(overrides);
    setLight(tokensLight);
    setDark(tokensDark);
    setOpen(false);
  };

  return (
    <div className="field-type">
      <FieldLabel label={field.label} />

      <div className="mt-2.5 flex items-center gap-3">
        <Button
          buttonStyle="subtle"
          size="medium"
          onClick={() => setOpen(true)}
          disabled={readOnly}
        >
          {recipe ? 'Edit in theme studio' : 'Open theme studio'}
        </Button>

        {recipe && (
          <span className="twp text-muted-foreground text-xs">
            {summary.brandFamily} on {summary.baseFamily}
            {summary.radius === '0' ? ', square' : ''}
          </span>
        )}
      </div>

      {open &&
        createPortal(
          <div
            className="twp"
            style={{ position: 'fixed', inset: 0, zIndex: 2147483647 }}
            onClick={(event) => event.stopPropagation()}
            onMouseDown={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <ThemeStudio
              recipe={recipe}
              overrides={asOverrides(overridesValue)}
              onSelect={onSelect}
              onClose={() => setOpen(false)}
            />
          </div>,
          document.body
        )}
    </div>
  );
};

export default ThemeStudioField;

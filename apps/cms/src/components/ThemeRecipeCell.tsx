import { fontById, normaliseRecipe } from '@codeware/shared/util/color';
import type { DefaultServerCellComponentProps } from 'payload';

const capitalise = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1);

/**
 * The decisions behind a theme, at a glance in the list.
 *
 * A cell rather than columns, because a recipe is one JSON field: Payload has
 * nothing to sort or filter on here, and five columns of one-word values would
 * cost more width than they return.
 *
 * Read through `normaliseRecipe`, so a theme saved before a field existed shows
 * that field's default rather than a gap — the same reason the studio can open
 * one at all.
 *
 * Order matches the studio's controls: base, brand, heading, body, surface.
 * Two places, one order, so the summary reads as the form that produced it.
 */
export const ThemeRecipeCell: React.FC<
  DefaultServerCellComponentProps<never, never>
> = ({ cellData }) => {
  const recipe = normaliseRecipe(cellData);

  // Each value is one word out of context, so the label says what it decides —
  // not what it is, which is already on screen. A native `title` rather than a
  // tooltip component: the cell renders on the server, and a label for a
  // one-word value does not need a client bundle.
  const parts = [
    {
      label: 'Base colour — surfaces, borders, neutral text',
      value: capitalise(recipe.baseFamily)
    },
    {
      label: 'Brand colour — buttons, focus rings, links',
      value: capitalise(recipe.brandFamily)
    },
    {
      label: 'Heading typeface',
      value: fontById(recipe.fontHeading)?.label ?? recipe.fontHeading
    },
    {
      label: 'Body typeface',
      value: fontById(recipe.fontBody)?.label ?? recipe.fontBody
    },
    {
      label: 'Page surface — whether content sits on its own layer',
      value: capitalise(recipe.surface)
    }
  ];

  return (
    <span className="text-muted-foreground flex flex-wrap items-center gap-1 text-xs">
      {parts.map(({ label, value }, index) => (
        <span key={label} className="whitespace-nowrap">
          <span title={label}>{value}</span>
          {index < parts.length - 1 && (
            <span aria-hidden className="px-1 opacity-40">
              ·
            </span>
          )}
        </span>
      ))}
    </span>
  );
};

export default ThemeRecipeCell;

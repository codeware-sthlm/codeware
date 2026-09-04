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

  const parts = [
    capitalise(recipe.baseFamily),
    capitalise(recipe.brandFamily),
    fontById(recipe.fontHeading)?.label ?? recipe.fontHeading,
    fontById(recipe.fontBody)?.label ?? recipe.fontBody,
    capitalise(recipe.surface)
  ];

  return (
    <span className="text-muted-foreground flex flex-wrap items-center gap-1 text-xs">
      {parts.map((part, index) => (
        <span key={`${part}-${index}`} className="whitespace-nowrap">
          {part}
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

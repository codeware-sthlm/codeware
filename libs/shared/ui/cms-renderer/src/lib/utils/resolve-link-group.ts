/**
 * Implicit contract: the shape of `linkGroupField` value as it comes out of
 * the editor, which this function must be able to resolve.
 *
 * Anywhere this function is used, the input must be guaranteed to match this shape,
 * which is the actual guard, satisfied by the generated Payload types.
 *
 * When `linkGroupField` drifts from this type, TypeScript will error anywhere
 * `resolveLinkGroup` is used.
 */
type LinkGroupShape = {
  type?: ('reference' | 'custom') | null;
  newTab?: boolean | null;
  reference?:
    | ({ relationTo: string; value: number | { slug?: string | null } } | null)
    | undefined;
  url?: string | null;
  label?: string | null;
};

type ResolvedLinkGroup = {
  /**
   * Reference links: absolute path with a leading slash, e.g. `"/about"` or
   * `"/posts/my-post"` — ready to pass directly to `navigate()`.
   *
   * Custom links: the raw URL as entered by the editor, e.g.
   * `"https://github.com/..."` or `"/contact"` — use as-is.
   */
  path: string;
  label: string | undefined;
  newTab: boolean;
};

/**
 * Resolve all base properties of a Payload `linkGroupField` into a plain object.
 *
 * Blocks without `customFields` can use this directly.
 * Blocks with custom fields extend it by reading the
 * extra fields from the link and layering them on top of this result.
 *
 * Returns `null` when the link cannot be resolved (unset type, unresolved
 * reference depth, or missing custom URL).
 */
export const resolveLinkGroup = (
  link: LinkGroupShape
): ResolvedLinkGroup | null => {
  let path: string;

  switch (link.type) {
    case 'reference': {
      if (typeof link.reference?.value !== 'object' || !link.reference.value) {
        return null;
      }
      const { relationTo, value } = link.reference;
      const slug = value.slug;
      if (!slug) return null;
      path = relationTo === 'pages' ? `/${slug}` : `/${relationTo}/${slug}`;
      break;
    }
    case 'custom':
      if (!link.url) return null;
      path = link.url;
      break;
    default:
      return null;
  }

  return {
    path,
    label: link.label ?? undefined,
    newTab: link.newTab ?? false
  };
};

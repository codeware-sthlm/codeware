import type { PageDetails } from '../root';

export const filterPages = (
  pages: Array<PageDetails>,
  excludeSlugs: Array<string>
) => {
  return (
    pages
      .filter(({ slug }) => slug && !excludeSlugs.includes(slug))
      // Fix correct type for slug
      .map(({ slug, title }) => ({ slug: String(slug), title }))
  );
};

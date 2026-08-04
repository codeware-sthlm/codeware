import type { Page, Post, Tour } from '@codeware/shared/util/payload-types';
import { seoPlugin } from '@payloadcms/plugin-seo';
import type { GenerateTitle, GenerateURL } from '@payloadcms/plugin-seo/types';

// SEO auto-generate functions

const generateTitle: GenerateTitle<Page | Post | Tour> = async ({ doc }) =>
  'name' in doc ? doc.name : doc.title;

const generateURL: GenerateURL<Page | Post | Tour> = async ({
  collectionSlug,
  doc,
  req: { origin }
}) => `${origin}/${collectionSlug}/${doc.slug ?? ''}`;

export const getSeoPlugin = () => {
  return seoPlugin({
    uploadsCollection: 'media',
    generateTitle,
    generateURL
  });
};

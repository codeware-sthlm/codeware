import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField
} from '@payloadcms/plugin-seo/fields';
import type { Tab } from 'payload';

/**
 * SEO tab for collections that should have SEO support
 */
export const seoTab: Tab = {
  name: 'meta',
  label: 'SEO',
  fields: [
    OverviewField({}),
    MetaTitleField({
      hasGenerateFn: true
    }),
    MetaImageField({
      relationTo: 'media'
    }),
    MetaDescriptionField({}),
    PreviewField({ hasGenerateFn: true })
  ]
};

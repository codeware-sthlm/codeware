import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField
} from '@payloadcms/plugin-seo/fields';
import type { Tab } from 'payload';

type Options = {
  /**
   * Offer auto-generate buttons for the meta title and the search preview.
   *
   * Turn this off for collections that have an array or blocks field with a
   * custom `RowLabel`. Payload keeps the rendered label at
   * `fieldState.rows[n].customComponents`, but `reduceToSerializableFields`
   * only strips `customComponents` at the top level of a field — so the node
   * survives into the form state that plugin-seo passes to `JSON.stringify`
   * when generating, and throws `Converting circular structure to JSON`.
   *
   * Only the generate path serializes form state, so disabling it keeps every
   * SEO field editable. Worth revisiting once the shallow strip is fixed
   * upstream.
   *
   * @default true
   */
  hasGenerateFn?: boolean;
};

/**
 * SEO tab for collections that should have SEO support.
 */
export const seoTab = ({ hasGenerateFn = true }: Options = {}): Tab => ({
  name: 'meta',
  label: { en: 'SEO', sv: 'SEO' },
  fields: [
    OverviewField({}),
    MetaTitleField({
      hasGenerateFn
    }),
    MetaImageField({
      relationTo: 'media'
    }),
    MetaDescriptionField({}),
    PreviewField({ hasGenerateFn })
  ],
  admin: {
    disableListColumn: true
  }
});

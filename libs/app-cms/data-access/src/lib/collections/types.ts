import type {
  CollectionSlug,
  TypedCollection,
  TypedLocale,
  Where
} from 'payload';

export type QuerySingleOptions = {
  /**
   * Depth of relationships to populate
   */
  depth?: number;

  /**
   * Locale for localized content
   */
  locale?: TypedLocale;
};

export type QueryMultipleOptions<TSlug extends CollectionSlug> =
  QuerySingleOptions & {
    /**
     * Maximum number of documents to return
     */
    limit?: number;

    /**
     * Custom where clause for filtering
     */
    where?: Where;

    /**
     * Sort order (e.g., 'name' for alphabetical)
     */
    sort?: keyof TypedCollection[TSlug];
  };

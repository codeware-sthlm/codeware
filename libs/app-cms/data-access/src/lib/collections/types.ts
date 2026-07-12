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
   * Fetch draft version of the document (requires versions/drafts to be enabled on the collection)
   */
  draft?: boolean;

  /**
   * Locale to query (overrides tenant configuration when available)
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
     * Sort order (e.g., 'name' for alphabetical, '-updatedAt' for descending)
     */
    sort?: SortKey<TSlug>;
  };

type SortKey<TSlug extends CollectionSlug> =
  | (string & keyof TypedCollection[TSlug])
  | `-${string & keyof TypedCollection[TSlug]}`;

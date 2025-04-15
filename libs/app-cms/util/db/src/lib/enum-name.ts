import type { DBIdentifierName } from 'payload';

/**
 * Create a custom enum name for a field.
 *
 * This is useful to consolidate auto-generated enum names into unique entities,
 * and have a "single source of truth" for enums.
 *
 * It's also vital for fields that are reused accross blocks and other fields,
 * which can generate quite long nested enum names.
 *
 * For example:
 *
 * ```sh
 * Error [APIError]: Exceeded max identifier length for table or enum name of 63 characters. Invalid name: enum_reusable_content_blocks_card_custom_cards_card_link_nav_trigger
 * ```
 *
 * The created enum name is set to the identifier prefixed with `enum_`,
 * which can be disabled via the `enumPrefix` option.
 * Parent table name can also be applied as prefix via the `parentTable` option.
 *
 * @param identifier - The identifier of the field.
 * @param options - The options for the enum name.
 * @returns The enum name.
 *
 * @example
 * ```ts
 * ...
 * fields: [
 *   {
 *     name: 'favoriteMovie',
 *     type: 'select',
 *     options: [ ... ],
 *     enumName: enumName('favorite_movie'),
 *     // enum_favorite_movie
 *     ...
 *   },
 *   {
 *     name: 'favoriteFood',
 *     type: 'select',
 *     options: [ ... ],
 *     enumName: enumName('favorite_food', { parentTable: true }),
 *     // enum_parent_table_name_favorite_food
 *     ...
 *   },
 *   {
 *     name: 'favoriteDrink',
 *     type: 'select',
 *     options: [ ... ],
 *     enumName: enumName('favorite_drink', { enumPrefix: false }),
 *     // favorite_drink
 *     ...
 *   },
 * ],
 * ...
 * ```
 */
export const enumName =
  (
    identifier: string,
    options?: {
      /**
       * Whether to include the enum prefix in the enum name.
       *
       * @default true
       */
      enumPrefix?: boolean;
      /**
       * Whether to include the parent table name in the enum name.
       *
       * @default false
       */
      parentTable?: boolean;
    }
  ): DBIdentifierName =>
  ({ tableName }) => {
    const enumPrefix = (options?.enumPrefix ?? true) ? 'enum_' : '';
    const tablePrefix =
      options?.parentTable && tableName ? `${tableName}_` : '';

    return `${enumPrefix}${tablePrefix}${identifier}`;
  };

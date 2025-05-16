import type { Field, FieldBase, FieldHook } from 'payload';

type Options<TField> = {
  /**
   * The field of choice to use.
   * @see https://payloadcms.com/docs/fields/overview
   */
  field: TField;
  /**
   * A hook function that should return the composed value of the field.
   * @see https://payloadcms.com/docs/hooks/fields
   */
  value: FieldHook;
};

/**
 * Virtual compose field that is used to combine multiple fields from different collections
 * into a field that is not stored in the database.
 *
 * At its core it's a virtual field, setup according to Payload best practices
 * and with required hook function responsible for composing the field value.
 * @see https://payloadcms.com/docs/fields/overview#virtual-fields
 *
 * **Tip!**
 *
 * The field is hidden by default in the admin panel but can be shown
 * by setting the `admin.hidden` property to `false`.
 *
 * @param options The options for the virtual compose field.
 * @returns Mutated `field` property.
 */
export const virtualComposeField = <
  TField extends Field & {
    access?: FieldBase['access'];
    hooks?: FieldBase['hooks'];
    virtual?: true;
  }
>({
  field,
  value: valueHookFn
}: Options<TField>): TField => {
  return {
    ...field,
    virtual: true,
    access: {
      ...(field.access ?? {}),
      create: () => false,
      update: () => false
    },
    admin: {
      hidden: true,
      ...(field.admin ?? {})
    },
    hooks: {
      afterRead: [valueHookFn, ...(field.hooks?.afterRead ?? [])],
      beforeChange: [
        // Ensures data is not stored in DB
        ({ field: { name }, siblingData }) => {
          if (name && name in siblingData) {
            console.log(
              `Virtual field ${name} is not stored in the database. Removing from siblingData.`
            );
            delete siblingData[name];
          }
        },
        ...(field.hooks?.beforeChange ?? [])
      ]
    }
  };
};

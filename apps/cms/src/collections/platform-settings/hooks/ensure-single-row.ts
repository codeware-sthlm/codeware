import { customT } from '@codeware/app-cms/util/i18n';
import type { CollectionBeforeValidateHook } from 'payload';
import { ValidationError } from 'payload';

/**
 * Refuse a second row.
 *
 * Platform settings is a singleton by convention rather than by Payload's
 * `isGlobal` — that flag belongs to the multi-tenant plugin's per-tenant
 * globals, and this collection carries no `tenant` field for the plugin to
 * key on. This hook is what keeps it to one document instead.
 */
export const ensureSingleRow: CollectionBeforeValidateHook = async ({
  operation,
  req
}) => {
  if (operation !== 'create') {
    return;
  }

  const { payload, t } = req;

  const { totalDocs } = await payload.find({
    collection: 'platform-settings',
    depth: 0,
    limit: 1,
    pagination: false,
    req
  });

  if (totalDocs) {
    throw new ValidationError({
      collection: 'platform-settings',
      errors: [
        {
          message: customT(t)('validation:platformSettingsSingleton'),
          path: 'id'
        }
      ]
    });
  }
};

import { isTenant } from '@codeware/app-cms/util/misc';
import type { FormSubmission } from '@codeware/shared/util/payload-types';
import type { CollectionBeforeValidateHook } from 'payload';

export const ensureTenant: CollectionBeforeValidateHook<
  FormSubmission
> = async ({ req: { user }, data, operation }) => {
  if (operation !== 'create' || !data) {
    return data;
  }

  if (!isTenant(user)) {
    return data;
  }

  // Update tenant from the request
  data.tenant = user.id;
  return data;
};

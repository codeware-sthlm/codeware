import { getId } from '@codeware/app-cms/util/misc';
import type { Navigation } from '@codeware/shared/util/payload-types';
import type { Payload } from 'payload';

// Refine the model to type safe the data
type NavigationReference = Pick<
  NonNullable<Pick<Navigation, 'items'>['items']>[number],
  'reference'
>;
export type NavigationData = NonNullable<Pick<Navigation, 'tenant'>> & {
  items: Array<NavigationReference>;
};

/**
 * Ensure that navigation items exist for the given tenant.
 *
 * Navigation labels is limited to the document title only.
 *
 * Navigation will not be updated if atleast one item exist,
 * though the items do not match the given data.
 *
 * @param payload - Payload instance
 * @param transactionID - Transaction ID when supported by the database
 * @param data - Navigation data
 * @returns The navigation ID if exists or the object when created, otherwise undefined
 */
export async function ensureNavigation(
  payload: Payload,
  transactionID: string | number | undefined,
  data: NavigationData
): Promise<Navigation | string | number> {
  const { items, tenant } = data;

  if (!tenant) {
    throw new Error('Tenant is required');
  }

  // Check if the navigation exists with the given tenant
  const navigations = await payload.find({
    collection: 'navigation',
    where: {
      tenant: { in: [getId(tenant)] }
    },
    depth: 0,
    limit: 1,
    req: { transactionID }
  });

  if (navigations.totalDocs) {
    const { items, id } = navigations.docs[0];

    if (items?.length) {
      return id;
    }
  }

  // No navigation found, create one

  const navigation = await payload.create({
    collection: 'navigation',
    data: {
      items: items.map(({ reference }) => ({
        reference,
        labelSource: 'document'
      })),
      tenant
    },
    req: { transactionID }
  });

  return navigation;
}

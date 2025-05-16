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
 * Navigation collection is handled like a global via multi-tenant plugin.
 * This means each tenant has one row with all the items defined.
 *
 * Navigation labels is limited to the document title only.
 *
 * Navigation is updated when provided data contains new items.
 * Existing items will be kept unchanged and nothing will be removed.
 *
 * @param payload - Payload instance
 * @param transactionID - Transaction ID when supported by the database
 * @param data - Navigation data
 * @returns The navigation ID if exists or the object when created, otherwise undefined, with the items that was added.
 */
export async function ensureNavigation(
  payload: Payload,
  transactionID: string | number | undefined,
  data: NavigationData
): Promise<{
  navigation: Navigation | number;
  items: Array<NavigationReference>;
}> {
  const { items: dataItems, tenant } = data;

  if (!tenant) {
    throw new Error('Tenant is required');
  }

  let itemsToAdd: Array<NavigationReference> = [];

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
    const { items, id: docId } = navigations.docs[0];

    if (items?.length) {
      // Add the missing items
      const missingItems = dataItems.filter(
        ({ reference }) =>
          !items.some(
            (item) =>
              item.reference.relationTo === reference.relationTo &&
              getId(item.reference.value) === getId(reference.value)
          )
      );
      if (missingItems.length) {
        // Merge current items with the new ones
        itemsToAdd = items
          .concat(missingItems)
          .map(({ customLabel, id, reference }) => ({
            id,
            customLabel,
            reference,
            labelSource: 'document'
          }));

        await payload.update({
          collection: 'navigation',
          id: docId,
          data: {
            items: itemsToAdd
          },
          req: { transactionID }
        });
      }
      return {
        navigation: docId,
        items: missingItems
      };
    }
  }

  // No navigation found, create one with data items

  itemsToAdd = dataItems.map(({ reference }) => ({
    reference,
    labelSource: 'document'
  }));

  const navigation = await payload.create({
    collection: 'navigation',
    data: {
      items: itemsToAdd,
      tenant
    },
    req: { transactionID }
  });

  return { navigation, items: itemsToAdd };
}

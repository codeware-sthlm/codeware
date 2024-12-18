import { Payload } from 'payload';

import { Tenant } from '../generated/payload-types';

type Data = Pick<Tenant, 'name' | 'description' | 'apiKey'>;

const collection = 'tenants';

/**
 * Ensure that a tenant exists and has an API key created.
 *
 * When the API key is not provided, it will be generated by Payload.
 *
 * @param payload - Payload instance
 * @param data - Tenant data
 * @throws Never - just logs errors
 */
export async function ensureTenant(
  payload: Payload,
  data: Data
): Promise<void> {
  try {
    const { name, description, apiKey } = data;

    const tenants = await payload.find({
      collection,
      where: { name: { equals: name } },
      pagination: false
    });

    // TODO: Need a unique field instead of name, probably the domain
    if (tenants.totalDocs > 1) {
      throw new Error(`Multiple tenants found with name '${name}', skip`);
    }

    if (tenants.totalDocs === 1) {
      const tenant = tenants.docs[0];
      if (tenant.apiKey) {
        payload.logger.info(
          `Tenant '${name}' already exists and has an API key, skip`
        );
        return;
      }

      if (!apiKey) {
        throw new Error(
          `Tenant '${name}' exist and needs an API key but no key is provided, skip`
        );
      }

      payload.logger.info(
        `Tenant '${name}' exist and needs an API key, updating`
      );

      await payload.update({
        collection,
        id: tenant.id,
        data: { apiKey }
      });

      payload.logger.info(`Tenant '${name}' was updated`);
      return;
    }

    // No tenant found, create one

    payload.logger.info(`Creating tenant '${name}'`);

    if (!apiKey) {
      payload.logger.info('API key is not provided and will be generated');
    }

    await payload.create({
      collection,
      data: {
        enableAPIKey: true,
        apiKey,
        description,
        name
      } satisfies Partial<Tenant>
    });

    payload.logger.info(`Tenant '${name}' was created`);
  } catch (error) {
    console.error(error);
  }
}
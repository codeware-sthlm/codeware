import type {
  SeedSource,
  SeedStrategy
} from '@codeware/app-cms/util/env-schema';
import { randPassword } from '@ngneat/falso';
import type { Payload, PayloadRequest } from 'payload';

import { loadInfisicalData } from './load-infisical-data';
import { loadStaticData } from './load-static-data';
import { ensureCategory } from './local-api/ensure-category';
import { ensurePage } from './local-api/ensure-page';
import { ensurePost } from './local-api/ensure-post';
import { ensureTenant } from './local-api/ensure-tenant';
import { ensureUser } from './local-api/ensure-user';
import type { SeedData, SeedEnvironment } from './seed-types';
import { convertMarkdownToLexical } from './utils/convert-markdown-to-lexical';
import { tempStore } from './utils/temp-store';

/**
 * Seed Payload collections.
 *
 * The seed process is designed to only make changes when needed.
 * It can run multiple times without creating duplicates.
 *
 * Data is loaded from Infisical or local static data depending on the seed source.
 *
 * If no data is found, seeding is skipped.
 *
 * Database transaction is used when supported by the database.
 *
 * @returns `true` if seeding was successful or skipped for a reason, otherwise `false`
 * @throws Never - just logs errors
 */
export const seed = async (args: {
  environment: SeedEnvironment;
  payload: Payload;
  source: SeedSource;
  strategy: SeedStrategy;
}): Promise<boolean> => {
  // Support transactions
  const req = {} as PayloadRequest;
  const { environment, payload, source, strategy } = args;

  try {
    if (source === 'off') {
      payload.logger.info('[SEED] Seed source is off, skip seeding');
      return true;
    }

    if (strategy === 'once') {
      // Do not seed if tenants already exists
      const { totalDocs } = await payload.db.count({
        collection: 'tenants'
      });
      if (totalDocs > 0) {
        payload.logger.info(
          '[SEED] Seed strategy is once, tenants already exists, skip seeding'
        );
        return true;
      }
    }

    let seedData: SeedData | null = null;

    payload.logger.info('[SEED] Seed started');

    // Try to load seed data from Infisical when source has cloud
    if (source === 'cloud' || source === 'cloud-local') {
      seedData = await loadInfisicalData(args);
    }

    // !! Production guard !! //
    // This will break DX since we can have local fallback for any environment.
    // At the moment we rather protect production data than risk it.
    if (!seedData && environment === 'production') {
      payload.logger.warn(
        `[SEED] Could not load secrets from cloud, skip seeding to protect ${environment} data`
      );
      return true;
    }

    // Fallback to static data when unable to seed from cloud
    if (!seedData && source === 'cloud-local') {
      payload.logger.info(
        '[SEED] Could not load secrets from cloud, fallback to local data'
      );
      seedData = loadStaticData(args);
    }

    // Still no seed data, which is expected for local only, so get it
    if (!seedData && source === 'local') {
      seedData = loadStaticData(args);
    }

    // Check seed data is loaded
    if (!seedData?.tenants?.length) {
      payload.logger.warn('[SEED] No seed data was loaded, skip seeding');
      return true;
    }

    // We have seed data, sync it to the database

    // Start a transaction when supported by the database
    if (payload.db.beginTransaction) {
      req.transactionID = (await payload.db.beginTransaction()) || undefined;
      if (req.transactionID) {
        payload.logger.debug(`[SEED] Started transaction ${req.transactionID}`);
      }
    }

    // TENANTS

    for (const tenant of seedData.tenants) {
      try {
        const response = await ensureTenant(payload, req, {
          apiKey: tenant.apiKey,
          description: tenant.description,
          name: tenant.name,
          hosts: tenant.hosts
        });

        let tenantId: number;
        if (typeof response === 'object') {
          payload.logger.info(`[SEED] Tenant '${tenant.name}'`);
          tenantId = response.id;
        } else {
          tenantId = Number(response);
        }
        // Save tenant id to map to lookup tenants later
        tempStore.storeTenant(tenant.apiKey, tenantId);
      } catch (error) {
        // Abort when we have a problem with a tenant
        payload.logger.error(
          `[SEED] Problem occurred with tenant '${tenant.name}', abort seeding`
        );
        throw error;
      }
    }
    payload.logger.info('[SEED] >> Tenants up to date');

    // USERS

    if (seedData.users.length > 0) {
      let userFailed = false;

      for (const user of seedData.users) {
        const tenants = tempStore.lookupTenantWithRole(payload, user.tenants);

        try {
          const password =
            user.password ||
            (environment === 'development'
              ? 'dev'
              : environment === 'preview'
                ? 'pallevante'
                : // Production will not happen, but just in case
                  randPassword().toString());

          const response = await ensureUser(payload, req, {
            description: user.description,
            email: user.email,
            name: user.name,
            password,
            role: user.role,
            tenants
          });

          let userId: number;
          if (typeof response === 'object') {
            payload.logger.info(
              `[SEED] User '${user.name}' on tenants ${
                tenants
                  .map(({ role, tenant: id }) => `#${id} (${role})`)
                  .join(', ') || '<none>'
              }`
            );
            userId = response.id;
          } else {
            userId = Number(response);
          }
          // Save user id to map to lookup users later
          tempStore.storeUser(user.email, userId);
        } catch (error) {
          payload.logger.error((error as Error).message);
          userFailed = true;
        }
      }
      payload.logger.info(
        userFailed
          ? '[SEED] Problem occurred with users, check your data!'
          : '[SEED] >> Users up to date'
      );
    }

    // CATEGORIES

    if (seedData.categories.length > 0) {
      let categoryFailed = false;

      for (const category of seedData.categories) {
        const [entity] = tempStore.lookupTenant(payload, [category.tenant]);

        try {
          const response = await ensureCategory(payload, req, {
            name: category.name,
            slug: category.slug,
            tenant: entity.tenant
          });

          let categoryId: number;
          if (typeof response === 'object') {
            payload.logger.info(
              `[SEED] Category '${category.slug}' on tenant #${entity.tenant}`
            );
            categoryId = response.id;
          } else {
            categoryId = Number(response);
          }
          // Save category id to map to lookup categories later
          tempStore.storeCategory(category.slug, categoryId);
        } catch (error) {
          payload.logger.error((error as Error).message);
          categoryFailed = true;
        }
      }
      payload.logger.info(
        categoryFailed
          ? '[SEED] Problem occurred with categories, check your data!'
          : '[SEED] >> Categories up to date'
      );
    }

    // PAGES

    if (seedData.pages.length > 0) {
      let pageFailed = false;

      for (const page of seedData.pages) {
        const [entity] = tempStore.lookupTenant(payload, [page.tenant]);

        try {
          const response = await ensurePage(payload, req, {
            header: page.header,
            layout: [
              {
                blockType: 'content',
                columns: [
                  {
                    size: 'full',
                    richText: await convertMarkdownToLexical(
                      payload.config,
                      page.layoutContent
                    )
                  }
                ]
              }
            ],
            name: page.name,
            slug: page.slug,
            tenant: entity.tenant
          });

          if (typeof response === 'object') {
            payload.logger.info(
              `[SEED] Page '${page.slug}' on tenant #${entity.tenant}`
            );
          }
        } catch (error) {
          payload.logger.error((error as Error).message);
          pageFailed = true;
        }
      }
      payload.logger.info(
        pageFailed
          ? '[SEED] Problem occurred with pages, check your data!'
          : '[SEED] >> Pages up to date'
      );
    }

    // POSTS

    if (seedData.posts.length > 0) {
      let postFailed = false;

      for (const post of seedData.posts) {
        const categories = tempStore.lookupCategory(payload, post.categories);
        const [entity] = tempStore.lookupTenant(payload, [post.tenant]);
        const authors = tempStore.lookupUser(payload, post.authors);

        try {
          const response = await ensurePost(payload, req, {
            authors,
            categories,
            content: await convertMarkdownToLexical(
              payload.config,
              post.content
            ),
            slug: post.slug,
            title: post.title,
            tenant: entity.tenant
          });

          if (typeof response === 'object') {
            payload.logger.info(
              `[SEED] Post '${post.slug}' on tenant #${entity.tenant}`
            );
          }
        } catch (error) {
          payload.logger.error(error);
          postFailed = true;
        }
      }
      payload.logger.info(
        postFailed
          ? '[SEED] Problem occurred with posts, check your data!'
          : '[SEED] >> Posts up to date'
      );
    }

    payload.logger.info('[SEED] >> Completed');

    // Commit transaction if started
    if (req.transactionID && payload.db.commitTransaction) {
      payload.logger.debug(`[SEED] Commit transaction ${req.transactionID}`);
      await payload.db.commitTransaction(req.transactionID);
    }
  } catch (error) {
    payload.logger.error((error as Error).message);
    payload.logger.error('[SEED] Something broke :(');

    // Rollback transaction if started
    if (req.transactionID && payload.db.rollbackTransaction) {
      payload.logger.info(`[SEED] Rollback transaction ${req.transactionID}`);
      await payload.db.rollbackTransaction(req.transactionID);
    }
    return false;
  }

  return true;
};

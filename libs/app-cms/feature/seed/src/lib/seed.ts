import { randPassword } from '@ngneat/falso';
import payload, { type Payload } from 'payload';
import { PayloadRequest } from 'payload/types';

import { loadInfisicalData } from './load-infisical-data';
import { loadStaticData } from './load-static-data';
import { ensureArticle } from './local-api/ensure-article';
import { ensurePage } from './local-api/ensure-page';
import { ensureTenant } from './local-api/ensure-tenant';
import { ensureUser } from './local-api/ensure-user';
import type { SeedSource } from './schemas/seed-source.schema';
import type { SeedData, SeedEnvironment } from './seed-types';
import { convertMarkdownToLexical } from './utils/convert-markdown-to-lexical';
import { tenantStore } from './utils/tenant-store';

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
}): Promise<boolean> => {
  // Support transactions
  const req = {} as PayloadRequest;

  try {
    const { environment, payload, source } = args;

    if (source === 'off') {
      payload.logger.info('[SEED] Seed source is off, skip seeding');
      return true;
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
        tenantStore.store(tenant.apiKey, tenantId);
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
        const tenants = tenantStore.lookupWithRole(payload, user.tenants);

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

          if (typeof response === 'object') {
            payload.logger.info(
              `[SEED] User '${user.name}' on tenants ${
                tenants
                  .map(({ role, tenant: id }) => `#${id} (${role})`)
                  .join(', ') || '<none>'
              }`
            );
          }
        } catch (error) {
          payload.logger.error(error);
          userFailed = true;
        }
      }
      payload.logger.info(
        userFailed
          ? '[SEED] Problem occurred with users, check your data!'
          : '[SEED] >> Users up to date'
      );
    }

    // PAGES

    if (seedData.pages.length > 0) {
      let pageFailed = false;

      for (const page of seedData.pages) {
        const [entity] = tenantStore.lookup(payload, [page.tenant]);

        try {
          const response = await ensurePage(payload, req, {
            content: convertMarkdownToLexical(page.content),
            header: page.header,
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
          payload.logger.error(error);
          pageFailed = true;
        }
      }
      payload.logger.info(
        pageFailed
          ? '[SEED] Problem occurred with pages, check your data!'
          : '[SEED] >> Pages up to date'
      );
    }

    // ARTICLES

    if (seedData.articles.length > 0) {
      let articleFailed = false;

      for (const article of seedData.articles) {
        const [entity] = tenantStore.lookup(payload, [article.tenant]);

        try {
          const response = await ensureArticle(payload, req, {
            author: article.author,
            content: convertMarkdownToLexical(article.content),
            slug: article.slug,
            title: article.title,
            tenant: entity.tenant
          });

          if (typeof response === 'object') {
            payload.logger.info(
              `[SEED] Article '${article.slug}' on tenant #${entity.tenant}`
            );
          }
        } catch (error) {
          payload.logger.error(error);
          articleFailed = true;
        }
      }
      payload.logger.info(
        articleFailed
          ? '[SEED] Problem occurred with articles, check your data!'
          : '[SEED] >> Articles up to date'
      );
    }

    payload.logger.info('[SEED] >> Completed');

    // Commit transaction if started
    if (req.transactionID && payload.db.commitTransaction) {
      payload.logger.debug(`[SEED] Commit transaction ${req.transactionID}`);
      await payload.db.commitTransaction(req.transactionID);
    }
  } catch (error) {
    payload.logger.error(error);
    payload.logger.error('[SEED] Something broke :(');

    // Rollback transaction if started
    if (req.transactionID && payload.db.rollbackTransaction) {
      payload.logger.debug(`[SEED] Rollback transaction ${req.transactionID}`);
      await payload.db.rollbackTransaction(req.transactionID);
    }
    return false;
  }

  return true;
};

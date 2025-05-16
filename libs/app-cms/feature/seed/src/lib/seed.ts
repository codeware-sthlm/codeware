import type {
  SeedSource,
  SeedStrategy
} from '@codeware/app-cms/util/env-schema';
import { randPassword } from '@ngneat/falso';
import type { Payload } from 'payload';

import { loadInfisicalData } from './load-infisical-data';
import { loadStaticData } from './load-static-data';
import { customSeed } from './local-api/custom-seed';
import { ensureCategory } from './local-api/ensure-category';
import { ensureMedia } from './local-api/ensure-media';
import { ensureNavigation } from './local-api/ensure-navigation';
import { ensurePage } from './local-api/ensure-page';
import { ensurePost } from './local-api/ensure-post';
import { ensureSiteSetting } from './local-api/ensure-site-setting';
import { ensureTag } from './local-api/ensure-tag';
import { ensureTenant } from './local-api/ensure-tenant';
import { ensureUser } from './local-api/ensure-user';
import type {
  SeedData,
  SeedEnvironment,
  StaticSeedOptions
} from './seed-types';
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
export const seed = async (
  args: {
    environment: SeedEnvironment;
    payload: Payload;
    source: SeedSource;
    strategy: SeedStrategy;
  } & Pick<StaticSeedOptions, 'remoteDataUrl'>
): Promise<boolean> => {
  const { environment, payload, remoteDataUrl, source, strategy } = args;

  // Support transactions
  let transactionID: string | number | undefined;

  /**
   * Start a new transaction when there is no transaction active.
   *
   * Accessable via `transactionID`
   */
  const ensureTransaction = async () => {
    if (transactionID) {
      return;
    }
    transactionID = (await payload.db.beginTransaction()) ?? undefined;
    if (transactionID) {
      payload.logger.info(`[SEED] Started transaction ${transactionID}`);
    }
  };

  /** Commit or rollback the current transaction when available */
  const endTransaction = async (action: 'commit' | 'rollback') => {
    if (!transactionID) {
      return;
    }
    if (action === 'commit') {
      payload.logger.info(`[SEED] Commit transaction ${transactionID}`);
      await payload.db.commitTransaction(transactionID);
    } else {
      payload.logger.info(`[SEED] Rollback transaction ${transactionID}`);
      await payload.db.rollbackTransaction(transactionID);
    }
    transactionID = undefined;
  };

  // Set to true when an error occurs to rollback the transaction at the end,
  // though there has been no exception thrown.
  let seedError = false;

  try {
    if (source === 'off') {
      payload.logger.info('[SEED] Seed source is off, skip seeding');
      return true;
    }

    if (strategy === 'once') {
      // Do not seed if tenants already exists
      const { totalDocs } = await payload.count({
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
      seedData = await loadInfisicalData({ environment, payload });
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
      seedData = loadStaticData({
        environment,
        payload,
        options: { remoteDataUrl }
      });
    }

    // Still no seed data, which is expected for local only, so get it
    if (!seedData && source === 'local') {
      seedData = loadStaticData({
        environment,
        payload,
        options: { remoteDataUrl }
      });
    }

    // Check seed data is loaded
    if (!seedData?.tenants?.length) {
      payload.logger.warn('[SEED] No seed data was loaded, skip seeding');
      return true;
    }

    // We have seed data, sync it to the database

    // TENANTS

    await ensureTransaction();
    for (const tenant of seedData.tenants) {
      try {
        const response = await ensureTenant(payload, transactionID, {
          apiKey: tenant.apiKey,
          description: tenant.description,
          domains: tenant.domains,
          name: tenant.name
        });

        let tenantId: number;
        if (typeof response === 'object') {
          payload.logger.info(
            `[SEED] Tenant '${tenant.name}' created (#${response.id})`
          );
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

    // Need to commit the data otherwise Postgres will fail on foreign key constraints
    // for the related collections.
    await endTransaction('commit');
    const { totalDocs: tenantCount } = await payload.count({
      collection: 'tenants'
    });
    payload.logger.info(`[SEED] >> Tenants up to date (count: ${tenantCount})`);

    // USERS

    // Only seed users when no errors occurred
    if (!seedError && seedData.users.length > 0) {
      await ensureTransaction();

      let userFailed = 0;

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

          const response = await ensureUser(payload, transactionID, {
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
        } catch (e) {
          const error = e as Error;
          payload.logger.error(error.message);
          if ('data' in error) {
            payload.logger.error(
              `User '${user.email}'\n${JSON.stringify(error.data, null, 2)}`
            );
          }
          userFailed++;
        }
      }
      const { totalDocs: userCount } = await payload.count({
        collection: 'users',
        req: { transactionID }
      });
      payload.logger.info(
        userFailed
          ? `[SEED] Problem occurred for ${userFailed}/${seedData.users.length} users (count: ${userCount})`
          : `[SEED] >> Users up to date (count: ${userCount})`
      );
      seedError = seedError || userFailed > 0;
    }

    // CATEGORIES

    if (seedData.categories.length > 0) {
      let categoryFailed = 0;

      for (const category of seedData.categories) {
        const [entity] = tempStore.lookupTenant(payload, [category.tenant]);

        try {
          const response = await ensureCategory(payload, transactionID, {
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
          // Save category to map to lookup id's later
          tempStore.storeCategory(
            { apiKey: category.tenant.lookupApiKey, slug: category.slug },
            categoryId
          );
        } catch (e) {
          const error = e as Error;
          payload.logger.error(error.message);
          if ('data' in error) {
            payload.logger.error(
              `Category '${category.slug}'\n${JSON.stringify(error.data, null, 2)}`
            );
          }
          categoryFailed++;
        }
      }
      const { totalDocs: categoryCount } = await payload.count({
        collection: 'categories',
        req: { transactionID }
      });
      payload.logger.info(
        categoryFailed
          ? `[SEED] Problem occurred for ${categoryFailed}/${seedData.categories.length} categories (count: ${categoryCount})`
          : `[SEED] >> Categories up to date (count: ${categoryCount})`
      );
      seedError = seedError || categoryFailed > 0;
    }

    // TAGS

    if (seedData.tags.length > 0) {
      let tagFailed = 0;

      for (const tag of seedData.tags) {
        const [entity] = tempStore.lookupTenant(payload, [tag.tenant]);

        try {
          const response = await ensureTag(payload, transactionID, {
            brand: tag.brand,
            name: tag.name,
            slug: tag.slug,
            tenant: entity.tenant
          });

          let tagId: number;
          if (typeof response === 'object') {
            payload.logger.info(
              `[SEED] Tag '${tag.slug}' on tenant #${entity.tenant}`
            );
            tagId = response.id;
          } else {
            tagId = Number(response);
          }
          // Save tag to map to lookup id's later
          tempStore.storeTag(
            { apiKey: tag.tenant.lookupApiKey, slug: tag.slug },
            tagId
          );
        } catch (e) {
          const error = e as Error;
          payload.logger.error(error.message);
          if ('data' in error) {
            payload.logger.error(
              `Tag '${tag.slug}'\n${JSON.stringify(error.data, null, 2)}`
            );
          }
          tagFailed++;
        }
      }
      const { totalDocs: tagCount } = await payload.count({
        collection: 'tags',
        req: { transactionID }
      });
      payload.logger.info(
        tagFailed
          ? `[SEED] Problem occurred for ${tagFailed}/${seedData.tags.length} tags (count: ${tagCount})`
          : `[SEED] >> Tags up to date (count: ${tagCount})`
      );
      seedError = seedError || tagFailed > 0;
    }

    // PAGES

    if (seedData.pages.length > 0) {
      let pageFailed = 0;

      for (const page of seedData.pages) {
        const [entity] = tempStore.lookupTenant(payload, [page.tenant]);

        try {
          const response = await ensurePage(payload, transactionID, {
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

          let pageId: number;
          if (typeof response === 'object') {
            payload.logger.info(
              `[SEED] Page '${page.slug}' on tenant #${entity.tenant}`
            );
            pageId = response.id;
          } else {
            pageId = Number(response);
          }
          // Save page to map to lookup id's later
          tempStore.storePage(
            { apiKey: page.tenant.lookupApiKey, slug: page.slug },
            pageId
          );
        } catch (e) {
          const error = e as Error;
          payload.logger.error(error.message);
          if ('data' in error) {
            payload.logger.error(
              `Page '${page.slug}'\n${JSON.stringify(error.data, null, 2)}`
            );
          }
          pageFailed++;
        }
      }
      const { totalDocs: pageCount } = await payload.count({
        collection: 'pages',
        req: { transactionID }
      });
      payload.logger.info(
        pageFailed
          ? `[SEED] Problem occurred for ${pageFailed}/${seedData.pages.length} pages (count: ${pageCount})`
          : `[SEED] >> Pages up to date (count: ${pageCount})`
      );
      seedError = seedError || pageFailed > 0;
    }

    // !! COMMIT POINT !!
    // Need to commit since the collections that follow require previous seed data
    await endTransaction(seedError ? 'rollback' : 'commit');

    // MEDIA

    // Only seed media when no errors occurred
    if (!seedError && seedData.media.length > 0) {
      await ensureTransaction();

      let mediaFailed = 0;

      for (const media of seedData.media) {
        const tags = tempStore.lookupTag(
          payload,
          media.tags.map(({ lookupSlug }) => ({
            apiKey: media.tenant.lookupApiKey,
            slug: lookupSlug
          }))
        );
        const [entity] = tempStore.lookupTenant(payload, [media.tenant]);

        try {
          const response = await ensureMedia(payload, transactionID, {
            alt: media.alt,
            external: media.external,
            filename: media.filename,
            filePath: media.filePath,
            tags,
            tenant: entity.tenant
          });

          let mediaId: number;
          if (typeof response === 'object') {
            payload.logger.info(
              `[SEED] Media '${media.filename}' on tenant #${entity.tenant}`
            );
            mediaId = response.id;
          } else {
            mediaId = Number(response);
          }
          // Save media to map to lookup id's later
          tempStore.storeMedia(
            { apiKey: media.tenant.lookupApiKey, slug: media.filename },
            mediaId
          );
        } catch (e) {
          const error = e as Error;
          payload.logger.error(error.message);
          if ('data' in error) {
            payload.logger.error(
              `Media '${media.filePath}'\n${JSON.stringify(error.data, null, 2)}`
            );
          }
          mediaFailed++;
        }
      }
      const { totalDocs: mediaCount } = await payload.count({
        collection: 'media',
        req: { transactionID }
      });
      payload.logger.info(
        mediaFailed
          ? `[SEED] Problem occurred for ${mediaFailed}/${seedData.media.length} media (count: ${mediaCount})`
          : `[SEED] >> Media up to date (count: ${mediaCount})`
      );
      seedError = seedError || mediaFailed > 0;
    }

    // POSTS

    // Only seed posts when no errors occurred
    if (!seedError && seedData.posts.length > 0) {
      await ensureTransaction();

      let postFailed = 0;

      for (const post of seedData.posts) {
        const categories = tempStore.lookupCategory(
          payload,
          post.categories.map(({ lookupSlug }) => ({
            apiKey: post.tenant.lookupApiKey,
            slug: lookupSlug
          }))
        );
        const [entity] = tempStore.lookupTenant(payload, [post.tenant]);
        const authors = tempStore.lookupUser(payload, post.authors);

        try {
          const response = await ensurePost(payload, transactionID, {
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
        } catch (e) {
          const error = e as Error;
          payload.logger.error(error.message);
          if ('data' in error) {
            payload.logger.error(
              `Post '${post.slug}'\n${JSON.stringify(error.data, null, 2)}`
            );
          }
          postFailed++;
        }
      }
      const { totalDocs: postCount } = await payload.count({
        collection: 'posts',
        req: { transactionID }
      });
      payload.logger.info(
        postFailed
          ? `[SEED] Problem occurred for ${postFailed}/${seedData.posts.length} posts (count: ${postCount})`
          : `[SEED] >> Posts up to date (count: ${postCount})`
      );
      seedError = seedError || postFailed > 0;
    }

    // NAVIGATION

    // Create navigation for each tenant using the first 5 tenant pages excluding the home page
    if (seedData.tenants.length > 0) {
      await ensureTransaction();

      let navigationFailed = 0;

      for (const tenant of seedData.tenants) {
        const [tenantEntity] = tempStore.lookupTenant(payload, [
          { lookupApiKey: tenant.apiKey }
        ]);
        // Lookup the first 5 tenant pages excluding the home page
        const pageIds = tempStore.lookupPage(
          payload,
          seedData.pages
            .filter(
              ({ slug, tenant: { lookupApiKey } }) =>
                lookupApiKey === tenant.apiKey && slug !== 'home'
            )
            .map(({ slug, tenant: { lookupApiKey } }) => ({
              apiKey: lookupApiKey,
              slug
            }))
            .slice(0, 5)
        );

        try {
          const { navigation, items } = await ensureNavigation(
            payload,
            transactionID,
            {
              items: pageIds.map((id) => ({
                reference: { relationTo: 'pages', value: id }
              })),
              tenant: tenantEntity.tenant
            }
          );

          if (typeof navigation === 'object') {
            payload.logger.info(
              `[SEED] Navigation with ${items.length} items for tenant '${tenant.apiKey}' created`
            );
          }
        } catch (e) {
          const error = e as Error;
          payload.logger.error(error.message);
          if ('data' in error) {
            payload.logger.error(
              `Navigation for tenant '${tenant.apiKey}'\n${JSON.stringify(error.data, null, 2)}`
            );
          }
          navigationFailed++;
        }
      }
      const { totalDocs: navigationCount } = await payload.count({
        collection: 'navigation',
        req: { transactionID }
      });
      payload.logger.info(
        navigationFailed
          ? `[SEED] Problem occurred for ${navigationFailed}/${seedData.tenants.length} navigations (count: ${navigationCount})`
          : `[SEED] >> Navigations up to date (count: ${navigationCount})`
      );
      seedError = seedError || navigationFailed > 0;
    }

    // SITE SETTINGS

    // Create settings for each tenant
    if (seedData.tenants.length > 0) {
      await ensureTransaction();

      let siteSettingFailed = 0;

      for (const tenant of seedData.tenants) {
        const [tenantEntity] = tempStore.lookupTenant(payload, [
          { lookupApiKey: tenant.apiKey }
        ]);
        // Landing page is "home" page
        const [page] = tempStore.lookupPage(payload, [
          { apiKey: tenant.apiKey, slug: 'home' }
        ]);

        if (!page) {
          siteSettingFailed++;
          continue;
        }

        try {
          const response = await ensureSiteSetting(payload, transactionID, {
            general: { appName: `${tenant.name} App`, landingPage: page },
            tenant: tenantEntity.tenant
          });

          if (typeof response === 'object') {
            payload.logger.info(
              `[SEED] Site setting for tenant '${tenant.apiKey}' created`
            );
          }
        } catch (e) {
          const error = e as Error;
          payload.logger.error(error.message);
          if ('data' in error) {
            payload.logger.error(
              `Site setting for tenant '${tenant.apiKey}'\n${JSON.stringify(
                error.data,
                null,
                2
              )}`
            );
          }
          siteSettingFailed++;
        }
      }
      const { totalDocs: siteSettingCount } = await payload.count({
        collection: 'site-settings',
        req: { transactionID }
      });
      payload.logger.info(
        siteSettingFailed
          ? `[SEED] Problem occurred for ${siteSettingFailed}/${seedData.tenants.length} site settings (count: ${siteSettingCount})`
          : `[SEED] >> Site settings up to date (count: ${siteSettingCount})`
      );
      seedError = seedError || siteSettingFailed > 0;
    }

    // CUSTOM SEED

    // Only run when no errors occurred
    if (!seedError) {
      await ensureTransaction();
      try {
        await customSeed(payload, transactionID);
      } catch (e) {
        const error = e as Error;
        payload.logger.error(error.message);
        if ('data' in error) {
          payload.logger.error(
            `Custom seed error\n${JSON.stringify(error.data, null, 2)}`
          );
        }
        seedError = true;
      }
    }

    await endTransaction(seedError ? 'rollback' : 'commit');

    if (seedError) {
      payload.logger.warn(
        '[SEED] >> Seed completed with issues, check your data!'
      );
    } else {
      payload.logger.info('[SEED] >> Completed successfully');
    }
  } catch (error) {
    payload.logger.error((error as Error).message);
    payload.logger.error('[SEED] Something broke :(');
    await endTransaction('rollback');
    return false;
  }

  return true;
};

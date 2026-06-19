import { z } from 'zod';

const CategoryLookupSchema = z.object({
  lookupSlug: z.string()
});

const TagLookupSchema = z.object({
  lookupSlug: z.string()
});

// TODO: import roles
const TenantLookupSchema = z.object({
  lookupApiKey: z.string(),
  role: z.enum(['admin', 'user'])
});

const UserLookupSchema = z.object({
  lookupEmail: z.string()
});

// TODO: define more schemas for other data types to reuse
export const SeedDataSchema = z.object({
  categories: z.array(
    z.object({
      name: z.string(),
      slug: z.string(),
      tenant: TenantLookupSchema.pick({ lookupApiKey: true })
    })
  ),
  media: z.array(
    z.object({
      alt: z.string(),
      external: z.boolean(),
      filename: z.string(),
      filePath: z.string(),
      tags: z.array(TagLookupSchema),
      tenant: TenantLookupSchema.pick({ lookupApiKey: true })
    })
  ),
  pages: z.array(
    z.object({
      name: z.string(),
      header: z.string().optional(),
      hero: z
        .object({
          badge: z.string().optional(),
          heading: z.string(),
          lede: z.string(),
          actions: z
            .array(
              z.object({
                link: z.object({
                  url: z.string(),
                  label: z.string(),
                  newTab: z.boolean().optional()
                }),
                emphasis: z.enum(['primary', 'secondary']).optional()
              })
            )
            .optional()
        })
        .optional(),
      featureCards: z
        .object({
          eyebrow: z.string().optional(),
          heading: z.string(),
          intro: z.string().optional(),
          columns: z.enum(['auto', '2', '3', '4']).optional(),
          items: z
            .array(
              z.object({
                brand: z
                  .object({
                    icon: z.string().optional(),
                    color: z.string().optional()
                  })
                  .optional(),
                title: z.string(),
                description: z.string()
              })
            )
            .optional()
        })
        .optional(),
      callout: z
        .object({
          showMark: z.boolean().optional(),
          heading: z.string(),
          body: z.string().optional(),
          link: z.object({
            url: z.string(),
            label: z.string(),
            newTab: z.boolean().optional()
          })
        })
        .optional(),
      layoutContent: z
        .string({ description: 'Layout column content as markdown' })
        .optional(),
      slug: z.string(),
      tenant: TenantLookupSchema.pick({ lookupApiKey: true })
    })
  ),
  posts: z.array(
    z.object({
      title: z.string(),
      slug: z.string(),
      createdAt: z.string(),
      authors: z.array(UserLookupSchema),
      categories: z.array(CategoryLookupSchema),
      content: z.string({ description: 'Markdown content' }),
      tenant: TenantLookupSchema.pick({ lookupApiKey: true })
    })
  ),
  users: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      email: z.string(),
      password: z.string(),
      role: z.enum(['system-user', 'user']),
      tenants: z.array(TenantLookupSchema),
      /** User preferred language */
      locale: z.enum(['en', 'sv'])
    })
  ),
  tags: z.array(
    z.object({
      name: z.string(),
      slug: z.string(),
      brand: z.object({
        color: z.string(),
        icon: z.string()
      }),
      tenant: TenantLookupSchema.pick({ lookupApiKey: true })
    })
  ),
  tenants: z.array(
    z.object({
      name: z.string(),
      slug: z.string(),
      description: z.string(),
      /** Seed data locale */
      locale: z.enum(['en', 'sv']),
      supportedLocales: z.array(z.enum(['en', 'sv'])),
      apiKey: z.string()
    })
  )
});

/**
 * Lookup category must also consider the tenant.
 */
export type CategoryLookup = z.infer<typeof CategoryLookupSchema>;

/**
 * Lookup tag must also consider the tenant.
 */
export type TagLookup = z.infer<typeof TagLookupSchema>;

/**
 * Lookup tenant should be unique.
 */
export type TenantLookup = z.infer<typeof TenantLookupSchema>;

/**
 * Lookup user should consider the tenant.
 */
export type UserLookup = z.infer<typeof UserLookupSchema>;

/**
 * Seed data.
 */
export type SeedData = z.infer<typeof SeedDataSchema>;

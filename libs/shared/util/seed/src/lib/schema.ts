import { z } from 'zod';

// TODO: import roles
const TenantLookupSchema = z.object({
  lookupApiKey: z.string(),
  role: z.enum(['admin', 'user'])
});

// TODO: define more schemas for other data types to reuse
export const SeedDataSchema = z.object({
  articles: z.array(
    z.object({
      title: z.string(),
      slug: z.string(),
      author: z.string(),
      content: z.string({ description: 'Markdown content' }),
      tenant: TenantLookupSchema.pick({ lookupApiKey: true })
    })
  ),

  pages: z.array(
    z.object({
      name: z.string(),
      header: z.string(),
      content: z.string({ description: 'Markdown content' }),
      slug: z.string(),
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
      tenants: z.array(TenantLookupSchema)
    })
  ),
  tenants: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      hosts: z.array(z.string()),
      apiKey: z.string()
    })
  )
});

/**
 * Lookup tenant by its API key since it should be unique.
 */
export type TenantLookup = z.infer<typeof TenantLookupSchema>;

export type SeedData = z.infer<typeof SeedDataSchema>;

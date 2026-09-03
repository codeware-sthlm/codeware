import { withCamelCase } from '@codeware/shared/util/zod';
import { z } from 'zod';

/**
 * The kinds of public address an app can hold.
 *
 * `shared_v4` is the free one every app with an `http_service` needs; a
 * dedicated `v4` is billed. `v6` is dedicated and free.
 *
 * Kept open with a string union so an address type added upstream reads as
 * itself rather than failing the whole list.
 */
export const IpTypeSchema = z
  .enum(['v4', 'v6', 'shared_v4', 'private_v6'])
  .or(z.string());

/**
 * Fly ips list response element schema
 *
 * ```ts
 * fly ips list --app [name] --json
 * ```
 *
 * Fly answers in PascalCase (`ID`, `Address`, …), which `withCamelCase`
 * rewrites before validation — so the keys here are the transformed ones.
 *
 * A shared v4 carries an empty `region` and a zero `createdAt`, so neither can
 * be treated as a datetime.
 */
export const IpsListFlyResponseElementSchema = z.object({
  id: z.string(),
  address: z.string(),
  type: IpTypeSchema,
  region: z.string(),
  createdAt: z.string()
});

/**
 * Transformed ips list response schema
 *
 * ```ts
 * fly ips list --app [name] --json
 * ```
 */
export const IpsListTransformedResponseSchema = withCamelCase(
  z.array(IpsListFlyResponseElementSchema)
);

import { hasRole, isUser } from '@codeware/app-cms/util/misc';
import { headers } from 'next/headers';
import { permanentRedirect } from 'next/navigation';
import type { ServerComponentProps } from 'payload';

import { paramKey } from './redirect-params';

/**
 * Verify the current host with the user domains.
 * The domains are defined in the tenants the user belongs to.
 *
 * If the host is not allowed to visit, redirect to the first cms domain for the user.
 * Otherwise let the user stay on the current host.
 *
 * Note! The user in this component is always logged in.
 * Tenancy restrictions is handled elsewhere, so it's perfecly safe to do nothing here.
 * The purpose is primarily to provide a better user experience,
 * especially when a tenant has custom branding (not supported yet).
 *
 * Use this server component anywhere in Payload where it's known that the user is logged in.
 * The component won't render anything but appends query parameters to identify the redirect action.
 *
 * Use it together with `RedirectNotifier` to notify the user about the redirect.
 *
 * @param payload - The payload object.
 * @param user - The user object.
 * @returns `null` if the user should stay on the current host otherwise trigger a redirect.
 */
const VerifyTenantDomain = async ({
  payload: {
    config: { serverURL },
    getAdminURL,
    logger
  },
  user
}: ServerComponentProps) => {
  // User is required to verify the tenant domain
  if (!isUser(user)) {
    return null;
  }

  // Users without tenants should be system users by design
  if (!user.tenants?.length) {
    if (!hasRole(user, 'system-user')) {
      logger.warn(
        `'${user.email}' is a regular user and should belong to a tenant, fix this`
      );
    }
    return null;
  }

  // Get all cms domains for the user
  const cmsDomains = user.tenants
    .flatMap(({ tenant }) =>
      typeof tenant === 'object'
        ? tenant.domains
            ?.filter((d) => d.pageTypes.includes('cms'))
            ?.map(({ domain }) => domain)
        : []
    )
    .filter(Boolean)
    .map((domain) => String(domain));

  if (!cmsDomains.length) {
    logger.warn(
      `'${user.email}' belongs to tenants without cms domains, fix this`
    );
    return null;
  }

  // Get the request host
  const host = (await headers()).get('host');
  if (!host) {
    logger.error('Could not get the host, skip verify tenant domain');
    return null;
  }

  // Check if user is accessing a valid domain
  if (cmsDomains.some((domain) => domain === host)) {
    return null;
  }

  logger.info(
    `'${user.email}' is trying to access '${host}' but is not allowed to do so`
  );

  // Redirect to the first domain
  const toDomain = cmsDomains[0];

  const protocol = serverURL.match(/^https?/)?.[0] ?? 'http';

  const url = new URL(`${protocol}://${toDomain}${getAdminURL()}`);
  url.searchParams.append(paramKey.from, host);
  url.searchParams.append(paramKey.email, user.email);

  logger.info(`Redirecting '${user.email}' to '${url.toString()}'`);

  // It is acceptable but not the best UX. Anyway, it should rarely happen.
  // Could this be solved with CSRF config settings?
  permanentRedirect(url.toString());
};

export default VerifyTenantDomain;

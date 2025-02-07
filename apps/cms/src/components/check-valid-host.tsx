import type { User } from '@codeware/shared/util/payload-types';
import { useAuth, useConfig } from 'payload/components/utilities';
import React, { useEffect } from 'react';

const checkHost = (
  host: string,
  tenants: User['tenants']
):
  | { status: true; domains: Array<string> | null }
  | { status: false; domains: Array<string> } => {
  if (!tenants) {
    return { status: true, domains: null };
  }

  const domains = tenants
    .flatMap(({ tenant }) =>
      typeof tenant === 'object'
        ? tenant.domains?.map(({ domain }) => domain)
        : []
    )
    .filter(Boolean)
    .map((domain) => String(domain));

  if (!domains.length) {
    return { status: true, domains };
  }
  if (domains.includes(host)) {
    return { status: true, domains };
  }
  return { status: false, domains };
};

/**
 * This component is used to check if the user is authorized to access the current host.
 *
 * When the current host doesn't match a domain via user tenants,
 * the user is logged out and redirected to login page.
 * A search param `invalid-host` is added to the login url for any custom components to use.
 */
const CheckValidHost: React.FC = () => {
  const { user: authUser, logOut } = useAuth();
  const {
    routes: { admin: adminRoute }
  } = useConfig();

  useEffect(() => {
    const { protocol, host } = window.location;
    // @ts-expect-error TS doesn't infer the correct type
    const user = authUser as User;
    const { status, domains } = checkHost(host, user.tenants);

    if (!status) {
      // Try to find tenant cms domain matching 'cms.*'
      // TODO: Can and should be improved, but the pattern is good enough for now
      const cmsDomain = domains.find((domain) => domain.match(/^cms\./));
      if (cmsDomain) {
        console.log('Redirect to tenant cms url:', cmsDomain);
        window.location.href = `${protocol}//${cmsDomain}`;
        return;
      }

      // Otherwise, log out and redirect to login page
      console.log('Permission denied to current host');
      logOut()
        .then(() => {
          window.location.replace(`${adminRoute}/login?invalid-host`);
        })
        .catch((error) => {
          console.error('Failed to log out:', error);
          window.location.replace('something-broke');
        });
    }
  }, [authUser]);

  return null;
};

export default CheckValidHost;

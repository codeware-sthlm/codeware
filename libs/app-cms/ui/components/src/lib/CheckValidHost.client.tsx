'use client';
import type { User } from '@codeware/shared/util/payload-types';
import { useAuth, useConfig } from '@payloadcms/ui';
import { useEffect } from 'react';

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
 * POC: This component is used to check if the user is authorized to access the current host.
 */
const CheckValidHost: React.FC = () => {
  const { user: authUser } = useAuth();
  const {
    config: {
      routes: { admin: adminRoute }
    }
  } = useConfig();

  useEffect(() => {
    const { host } = window.location;
    console.log('[DEBUG:CheckValidHost] authUser', authUser);
    console.log('[DEBUG:CheckValidHost] host', host);
    // @ts-expect-error TS doesn't infer the correct type
    const user = authUser as User;
    const { status, domains } = checkHost(host, user?.tenants ?? []);

    if (!status) {
      // Try to find tenant cms domain matching 'cms.*'
      // TODO: Can and should be improved, but the pattern is good enough for now
      const cmsDomain = domains.find((domain) => domain.match(/^cms\./));
      if (cmsDomain) {
        console.log(
          '[DEBUG:CheckValidHost] user should actually use domain:',
          cmsDomain
        );
        return;
      }

      console.log('[DEBUG:CheckValidHost] user is missing a valid domain');
    }
  }, [adminRoute, authUser]);

  return null;
};

export default CheckValidHost;

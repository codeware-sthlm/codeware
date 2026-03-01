import path from 'path';
import { fileURLToPath } from 'url';

import { fetchAppTenants } from '@codeware/nx-pre-deploy-action';
import type { Environment } from '@codeware/shared/feature/infisical';
import * as dotenv from 'dotenv';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

dotenv.config({ path: `${dirname}/../.env.infisical` });

const environment = (process.argv[2] || 'development') as Environment;
console.log(`Fetch data from ${environment}...`);

(async () => {
  try {
    const apps = await fetchAppTenants(
      {
        environment,
        site: 'eu',
        clientId: process.env.INFISICAL_CLIENT_ID ?? '',
        clientSecret: process.env.INFISICAL_CLIENT_SECRET ?? '',
        projectId: process.env.INFISICAL_PROJECT_ID ?? ''
      },
      ['web', 'cms']
    );

    console.log('Fetched app tenants:\n', JSON.stringify(apps, null, 2));
  } catch (error) {
    console.error('Error fetching app tenants');
  }
})();

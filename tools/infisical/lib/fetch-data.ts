import path from 'path';
import { fileURLToPath } from 'url';

import { withInfisical } from '@codeware/shared/feature/infisical';
import * as dotenv from 'dotenv';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

dotenv.config({ path: `${dirname}/../.env.infisical` });

(async () => {
  try {
    const apps = await withInfisical({
      environment: 'development',
      filter: { path: '/tenants', recurse: true },
      groupByFolder: true,
      debug: true
    });

    console.log('Fetched data:\n', JSON.stringify(apps, null, 2));
  } catch (error) {
    console.error('Error fetching data', error);
  }
})();

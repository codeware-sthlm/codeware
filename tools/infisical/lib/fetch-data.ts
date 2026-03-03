import path from 'path';
import { fileURLToPath } from 'url';

import { withInfisical } from '@codeware/shared/feature/infisical';
import * as dotenv from 'dotenv';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

dotenv.config({ path: `${dirname}/../.env.infisical` });

async function main() {
  const environment = process.argv[2] || 'development';
  console.log(`Fetch data from ${environment}...`);

  try {
    const apps = await withInfisical({
      environment,
      filter: { path: '/tenants', recurse: true },
      groupByFolder: true,
      debug: true
    });

    console.log('Fetched data:\n', JSON.stringify(apps, null, 2));
  } catch (error) {
    console.error(
      'Error fetching data\n',
      error instanceof Error ? error.message : error
    );
  }
}

// Export for use as a library
export { main as fetchDataMain };

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
}

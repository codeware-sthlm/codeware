import { release } from './release';

(async () => {
  const status = await release();
  process.exit(status);
})();

import { mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import { type Coverage, test as base } from '@playwright/test';
export * from '@playwright/test';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Coverage JSON content saved by the `_coverage` fixture */
export type CoverageJsonContent = {
  result: Awaited<ReturnType<Coverage['stopJSCoverage']>>;
};

/**
 * Extended test with automatic V8 coverage collection (**Note!** Chromium only).
 *
 * Coverage is saved to `.coverage/raw/` as individual JSON files.
 * Run global teardown merges them and generates the report.
 */
export const test = base.extend<{ _coverage: void }>({
  _coverage: [
    async ({ page }, use, testInfo) => {
      // page.coverage is only available in Chromium
      if (testInfo.project.name === 'chromium') {
        await page.coverage.startJSCoverage({ resetOnNavigation: false });
      }

      await use();

      if (testInfo.project.name === 'chromium') {
        const coverage = await page.coverage.stopJSCoverage();
        const dir = join(__dirname, '..', '.coverage', 'raw');

        mkdirSync(dir, { recursive: true });
        const name = testInfo.testId.replace(/[^\w]/g, '-');

        // monocart-coverage-reports expects the CDP raw coverage format
        const content: CoverageJsonContent = { result: coverage };
        writeFileSync(join(dir, `${name}.json`), JSON.stringify(content));
      }
    },
    { auto: true }
  ]
});

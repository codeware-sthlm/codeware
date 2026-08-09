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

/** A page error or server failure seen while the test ran */
type ObservedError = string;

/** Patterns a test declares as expected, matched against the observed text */
export type AllowedErrors = Array<RegExp | string>;

const isAllowed = (error: ObservedError, allowed: AllowedErrors) =>
  allowed.some((pattern) =>
    typeof pattern === 'string' ? error.includes(pattern) : pattern.test(error)
  );

/**
 * Extended test with:
 *
 * - automatic V8 coverage collection (**Note!** Chromium only)
 * - an error guard that fails the test on an uncaught browser exception or a
 *   5xx response, so a page does not have to be asserted on to be smoke tested
 */
export const test = base.extend<{
  _coverage: void;
  _errorGuard: void;
  allowedErrors: AllowedErrors;
}>({
  /**
   * Errors this test expects, so the guard stays quiet for them.
   *
   * Declared per file with `test.use({ allowedErrors: [...] })`. Prefer a
   * narrow pattern — a broad one silences the whole file.
   */
  allowedErrors: [[], { option: true }],

  /**
   * Fail on anything that broke without the test having to look for it.
   *
   * Covers uncaught exceptions in the browser and any 5xx the page received.
   * Console errors are deliberately *not* fatal: third-party noise, hydration
   * warnings and failed favicon loads would make the guard useless.
   *
   * Only browser-initiated traffic is observed. `page.request.*` calls go
   * through the context's API client, which does not raise page events — those
   * tests assert their status codes directly anyway.
   */
  _errorGuard: [
    async ({ page, allowedErrors }, use) => {
      const errors: Array<ObservedError> = [];

      page.on('pageerror', (error) => {
        errors.push(`uncaught: ${error.message}`);
      });

      page.on('response', (response) => {
        if (response.status() >= 500) {
          errors.push(`${response.status()}: ${response.url()}`);
        }
      });

      await use();

      const unexpected = errors.filter(
        (error) => !isAllowed(error, allowedErrors)
      );

      if (unexpected.length) {
        throw new Error(
          [
            `${unexpected.length} unexpected error(s) while the test ran:`,
            ...unexpected.map((error) => `  - ${error}`),
            '',
            'Add an `allowedErrors` pattern with `test.use({ allowedErrors: [...] })`',
            'when the error is the point of the test.'
          ].join('\n')
        );
      }
    },
    { auto: true }
  ],

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

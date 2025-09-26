import {
  type CreateNxWorkspaceProject,
  ensureCleanupDockerContainers,
  ensureCreateNxWorkspaceProject,
  ensureDockerConnectToLocalRegistry,
  resetDocker,
  waitForDockerLogMatch
} from '@codeware/e2e/utils';
import { runNxCommand } from '@nx/plugin/testing';
import { Browser, BrowserContext, Page, chromium } from '@playwright/test';

/**
 * !! Important !!
 *
 * This test suite requires docker to be running.
 *
 * Uses a minimal Playwright setup to test the UI.
 * Consider it a PoC to test the UI though we're running in a Jest context.
 */

describe('Test user login and onboarding', () => {
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;
  let project: CreateNxWorkspaceProject;

  /**
   * TODO: Run tests on a memory database or another isolated solution
   *
   * Currently `dx:start` doesn't support multiple database volumes,
   * which means these tests can run on a development database with a lot of data.
   *
   * Normally we seed the database with static data and there's always a system user
   * with known credentials. This user should be as good as it gets for now.
   */
  const credentials = {
    email: 'system@local.dev',
    password: 'dev'
  };

  jest.setTimeout(300_000);

  beforeAll(async () => {
    project = await ensureCreateNxWorkspaceProject({
      preset: '@cdwr/nx-payload'
    });

    ensureDockerConnectToLocalRegistry(project.appName);
    await ensureCleanupDockerContainers();

    // Start app and database and wait for app to be ready
    runNxCommand(`dx:start ${project.appName}`);
    await waitForDockerLogMatch({
      containerName: project.appName,
      match: /Ready in \d/,
      timeoutSeconds: 10
    });

    browser = await chromium.launch({
      headless: true,
      args: process.env.CI ? ['--no-sandbox'] : [],
      timeout: 120_000
    });
  });

  afterAll(async () => {
    if (context) {
      await context.close();
    }
    // Stop and cleanup containers
    runNxCommand(`dx:stop ${project.appName}`);
    await resetDocker(project.appName);
    runNxCommand('reset', { silenceError: true });
  });

  beforeEach(async () => {
    context = await browser.newContext();
    page = await context.newPage();
    await page.goto('http://localhost:3000');
  });

  afterEach(async () => {
    if (context) {
      await context.close();
    }
  });

  it('should have start page with hero and admin page link', async () => {
    const header = page.locator('h1');
    await header.waitFor();
    expect(await header.textContent()).toContain('Welcome');

    const adminLink = page.locator('a[href="/admin"]');
    await adminLink.waitFor();
    expect(await adminLink.textContent()).toContain('Admin');
  });

  it('should navigate to admin page and login or onboard user', async () => {
    const adminLink = page.locator('a[href="/admin"]');
    await adminLink.waitFor();

    // Get admin page in the new tab after clicking the admin link
    const [adminPage] = await Promise.all([
      context.waitForEvent('page'),
      adminLink.click()
    ]);
    await adminPage.waitForLoadState();

    const button = adminPage.getByRole('button');

    // Check if we have to onboard or login
    if ((await button.textContent()) === 'Login') {
      await adminPage.getByLabel('Email').fill(credentials.email);
      await adminPage.getByLabel('Password').fill(credentials.password);
    } else {
      await adminPage.getByLabel('Name').fill('Admin User');
      await adminPage.getByLabel('Email').fill(credentials.email);
      await adminPage.getByLabel('New Password').fill(credentials.password);
      await adminPage.getByLabel('Confirm Password').fill(credentials.password);
      // It's not a proper select field, so we have to click to reveal options and then click the option
      await adminPage.locator('#field-role').click();
      await adminPage.getByRole('option', { name: 'Admin' }).click();
    }

    // Submit form
    await button.click();

    // Verify we reach the dashboard with Users and Media cards
    await Promise.all([
      adminPage.locator('#card-users').waitFor(),
      adminPage.locator('#card-media').waitFor()
    ]);
  });
});

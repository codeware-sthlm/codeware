import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      // Scoped to workspace source roots so repo copies under `.claude/worktrees`
      // are not picked up as duplicate projects
      '{apps,e2e,libs,packages,tools}/**/vite.config.mts',
      '{apps,e2e,libs,packages,tools}/**/vitest.config.mts',
      // Remix build config with no `test` block — would otherwise become a
      // default project that collects `apps/web/tests` without globals/jsdom
      '!apps/web/vite.config.mts'
    ]
  }
});

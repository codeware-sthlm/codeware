import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      // Scoped to workspace source roots so repo copies under `.claude/worktrees`
      // are not picked up as duplicate projects. Both extensions are matched —
      // most configs are `.mts`, but `shared-theme` uses `.ts` and would
      // otherwise be skipped by the root config
      '{apps,e2e,libs,packages,tools}/**/vite.config.{ts,mts}',
      '{apps,e2e,libs,packages,tools}/**/vitest.config.{ts,mts}',
      // Remix build config with no `test` block — would otherwise become a
      // default project that collects `apps/web/tests` without globals/jsdom
      '!apps/web/vite.config.mts'
    ]
  }
});

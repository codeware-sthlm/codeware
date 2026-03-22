# nx-ai-plugin.md

## Purpose

The `nx-ai` plugin should provide an Nx-native way to analyze a workspace project with an LLM.

It should help developers inspect a project, collect the most relevant local context automatically, and ask Claude for focused feedback such as architecture, typing, maintainability, or refactoring suggestions.

The main goal is to avoid manually gathering and pasting files while keeping context bounded and cost controlled.

## V1 scope

Implement a Nx plugin in `packages/nx-ai` with:

- an `init` generator for workspace setup
- an `analyze` executor for project-level AI analysis

The `analyze` executor should:

- work on a specific Nx project
- collect prioritized files from that project
- optionally include a limited number of internal project dependencies
- build a focused prompt for Claude
- limit context size using options like `maxFiles` and avoid sending entire projects
- output analysis which should:
  - be structured and readable in terminal
  - group suggestions by category (architecture, typing, etc.)
  - include concrete actionable recommendations

The plugin structure should align with existing packages under `packages/`, especially other Nx plugins.

The plugin should be published as `@cdwr/nx-ai`.

## Non-goals

- automatic code editing
- CI integration
- whole-repo analysis by default
- inferred tasks in v1
- agentic multi-step workflows

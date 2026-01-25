# AI Documentation

This directory contains **authoritative guidance for AI-assisted development**
in this repository.

These documents are written to:

- Preserve architectural intent
- Prevent accidental regressions (auth, tenancy, deployment)
- Enable safe, repeatable AI-assisted refactoring and feature work

## Structure

- `CONTEXT.md`
  - Stable, high-level understanding of the system
  - What the system is, how it is deployed, and core architectural decisions

- `RULES.md`
  - Non-negotiable constraints
  - Security, tenancy, deployment, and operational invariants
  - AI must never violate these

- `TASKS/`
  - Task-specific or time-bound instructions
  - Refactoring guides, migrations, experiments
  - These may become obsolete over time

## Usage

When working with AI tools (Codex, Copilot Chat, agents, etc.):

1. Start with `docs/ai/CONTEXT.md`
2. Apply `docs/ai/RULES.md` at all times
3. Load any relevant task document from `docs/ai/TASKS/`

Human contributors are encouraged to read these documents as well.
They represent the intended mental model of the system.

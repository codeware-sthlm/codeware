# Database & Operations Management Scripts

## Fly.io Configuration Management

> **Note**: The Fly.io configuration tools have been moved to an Nx project at `tools/fly-tools`. See [tools/fly-tools/README.md](../tools/fly-tools/README.md) for full documentation.

### Quick Start

```bash
# Interactive mode - select patch and apps from menu
pnpm patch-fly-config

# With arguments
pnpm patch-fly-config tools/fly-tools/patches/optimize-cost.toml cdwr-
```

### Available Patches

Pre-configured patches in `tools/fly-tools/patches/`:

- **`optimize-cost.toml`** - Auto-suspend + minimal resources (free tier eligible)
- **`always-on-small.toml`** - Always-on 1x CPU + 512MB RAM
- **`performance.toml`** - 2x CPU + 1GB RAM for high-traffic apps
- **`health-check.toml`** - Standard `/api/health` endpoint configuration

### Legacy Bash Script

The original bash script `scripts/patch-fly-config.sh` is deprecated in favor of the new Nx tool. See [tools/fly-tools/README.md](../tools/fly-tools/README.md) for migration guide.

## Interactive Tools

These tools have been moved to an Nx project at `tools/db-tools`. See [tools/db-tools/README.md](../tools/db-tools/README.md) for full documentation.

## Available Tools

### Interactive Database Dropper

An interactive CLI tool for safely dropping databases from the Fly Postgres cluster.

#### Usage

```bash
pnpm drop-db
```

Or directly via Nx:

```bash
nx run db-tools:drop-db
```

### Interactive App Restarter

An interactive CLI tool for restarting Fly app machines.

#### Usage

```bash
pnpm restart-app
```

Or directly via Nx:

```bash
nx run db-tools:restart-app
```

## Features

- 🔐 Secure password input with masking (where applicable)
- 📋 Lists all available resources
- 🎯 Interactive selection with arrow keys and spacebar
- ⚠️ Confirmation prompts before destructive operations
- 🔄 Visual feedback with spinners
- 📊 Progress tracking
- ✨ Beautiful CLI experience powered by Clack
- ✨ Beautiful CLI experience powered by Clack

### How it works

1. Prompts for the `pg-preview` cluster password
2. Fetches all databases from the cluster
3. Displays them in an interactive list with metadata
4. Allows you to select one or more databases to drop (use spacebar to select, enter to confirm)
5. Shows a confirmation with the list of selected databases
6. Drops each database sequentially with progress tracking
7. Reports success/failure for each operation

## Simple Database Dropper (Legacy)

For programmatic or scripted use, the simple bash script is still available:

```bash
./scripts/drop-db-simple.sh <pr_number> <cluster_password>
```

Example:

```bash
./scripts/drop-db-simple.sh 201 your_cluster_password
```

This script drops databases following the naming pattern: `cdwr_cms_pr_{PR_NUMBER}`

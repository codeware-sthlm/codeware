# Codeware Tools

Interactive CLI tools for managing Fly.io apps, databases, and configurations.

## Quick Start

Run the interactive tool selector:

```bash
pnpm cdwr
```

Or run category-specific CLIs:

```bash
nx run infisical:cli
```

Or run individual tools directly:

```bash
nx run db-tools:drop-db
nx run fly-tools:restart-app
nx run fly-tools:app-info
nx run fly-tools:patch-config
nx run infisical:app-tenants
nx run infisical:data
nx run infisical:analysis
```

## Available Tools

### Database Tools

**drop-db** - Drop databases from Fly Postgres cluster
Interactive tool for safely dropping databases with confirmation prompts.

### Fly.io Tools

**restart-app** - Restart Fly app machines
Select an app and restart its machines with automatic state detection.

**app-info** - View app information
Display machine states, resources, and uptime for Fly apps.

**patch-config** - Apply configuration patches
Apply TOML configuration patches to multiple apps at once.

### Infisical Tools

Interactive selector: `nx run infisical:cli`

**app-tenants** - Fetch application tenants  
**data** - Fetch Infisical data  
**analysis** - Analyze Infisical configuration

## Requirements

- Node.js >= 20
- Fly CLI (`flyctl`) installed and authenticated for Fly tools
- PostgreSQL access credentials for database tools

## Development

All tools follow a dual-mode pattern and can be imported as library functions:

```typescript
import { restartApp } from './tools/fly-tools/lib/restart-app.js';
await restartApp({ app: 'my-app' });
```

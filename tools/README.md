# cdwr Tools

Interactive CLIs for managing deployments, databases and workspace configuration.

## Quick Start

Run the interactive tool selector and pick from the menu:

```bash
pnpm cdwr
```

Individual tools are also exposed as Nx targets on the `db-tools`, `fly-tools` and `infisical`
projects — run `nx show project <name>` to list them.

## Requirements

- Node.js >= 22
- Fly CLI (`flyctl`) installed and authenticated for the Fly tools
- Database access credentials for the database tools

## Development

All tools follow a dual-mode pattern and can be imported as library functions:

```typescript
import { restartApp } from './tools/fly-tools/lib/restart-app.js';
await restartApp({ app: 'my-app' });
```

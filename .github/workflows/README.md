# Running GitHub Actions Locally

## Getting Started

### Install `act`

#### macOS

```sh
brew install act
```

#### Linux

```sh
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash
```

#### Windows (with Chocolatey)

```powershell
choco install act-cli
```

> Remove or change `--container-architecture` in `.actrc` file.

### Secrets & Variables

Copy `.secrets.example` to `.secrets`.

Create your own PAT for test and replace the value for `GITHUB_TOKEN`.

- [Classic tokens](https://github.com/settings/tokens)
- [Fine-grained tokens](https://github.com/settings/tokens?type=beta)

`.vars` contains the variables used by the workflows.

Add more or update values in these files when needed.

## TLDR

```sh
# Validate `nx-migrate.yml`
act schedule -n -j nx-migrate

# Run `nx-migrate.yml` with local env file applied
act schedule --env-file .env.local -j nx-migrate
```

## Basic Usage

```sh
# Run all workflows
act

# Run a specific workflow
act -W .github/workflows/specific-workflow.yml

# List all available actions
act -l

# Run a specific event
act push
```

## Common Options

```sh
# Dry run
act -n

# Enable verbose logging
act -v

# Use workspace local env file instead of default `.env`
act --env-file .env.local

# Run workflow with specific inputs
act workflow_dispatch -i input1=value1 -i input2=value2
```

## Debugging Tips

### Use `-v` flag for verbose output

```sh
act -v
```

### Check container logs

```sh
docker logs $(docker ps -q --filter ancestor=catthehacker/ubuntu:act-latest)
```

### Interactive debugging

```sh
act -i
```

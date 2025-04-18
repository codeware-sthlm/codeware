# cms

Payload application generated by Nx plugin [`@cdwr/nx-payload`](https://github.com/codeware-sthlm/codeware/tree/master/packages/nx-payload).

## Start the application in Docker

```sh
npx nx dx:start cms
```

Visit <http://localhost:3000>

### Stop and remove Docker containers

```sh
npx nx dx:stop cms
```

> Database is stored in persistent volume, so containers can be stopped and started without loosing the data

## Serve application in development mode

First start the database in Docker when needed

```sh
npx nx dx:mongodb cms
```

or

```sh
npx nx dx:postgres cms
```

Then serve the application in development mode

```sh
npx nx dev cms
```

## Running tests

```sh
npx nx test cms
```

```sh
npx nx lint cms
```

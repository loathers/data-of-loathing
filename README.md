# data-of-loathing

This repo contains the infrastructure for serving typed Kingdom of Loathing game data as a queryable SQLite database.

It has three parts:

- `packages/etl` - pulls data from [KoLmafia](https://github.com/kolmafia/kolmafia)'s data files and populates the database, running on a schedule to stay current
- `packages/server` - an Express server that serves the SQLite file with ETag and Range request support
- `packages/client` - a typed TypeScript client for querying the database, published to npm as [data-of-loathing](https://www.npmjs.com/package/data-of-loathing)

The public database is hosted at [data.loathers.net](https://data.loathers.net). The client defaults to this endpoint, so most users only need to install the npm package.

See [packages/client/README.md](packages/client/README.md) for usage documentation.

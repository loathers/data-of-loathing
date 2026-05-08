# data-of-loathing

A typed client for querying Kingdom of Loathing game data. It wraps a SQLite database served by [data.loathers.net](https://data.loathers.net) and exposes it through a [MikroORM](https://mikro-orm.io) entity manager.

## Installation

```sh
npm install data-of-loathing
```

## Node

```ts
import { createClient } from "data-of-loathing";

const client = createClient();
await client.load();

const item = await client.query.findOne("Item", { name: "seal tooth" });
console.log(item?.autosell); // 1
```

The default strategy downloads the database from data.loathers.net and caches it to `~/.cache/data-of-loathing/`. It re-downloads only when the server's ETag changes.

You can point it at a local file instead:

```ts
const client = createClient({ strategy: "local", path: "./dol.sqlite" });
```

## Browser

Three strategies are available in the browser, each with different trade-offs.

`"memory"` downloads the full database on each page load and holds it in memory. Simple, but slow to start on a cold load. Once the browser has cached the database file, however, it will be as fast as any other solution.

```ts
import { createClient } from "data-of-loathing";

const client = createClient({ strategy: "memory" });
```

`"opfs"` downloads the database once and persists it to the [Origin Private File System](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system). Subsequent loads skip the download if the server's ETag matches.

```ts
const client = createClient({ strategy: "opfs" });
```

`"ranged"` never downloads the full database. It fetches only the SQLite pages it needs on demand using HTTP Range requests. This gives fast startup time at the cost of per-query network latency on a cold cache.

```ts
const client = createClient({ strategy: "ranged" });
```

All three accept a `url` option if you are hosting the database yourself:

```ts
const client = createClient({ strategy: "memory", url: "https://example.com/dol.sqlite" });
```

### Vite setup

Add the plugin to your Vite config:

```ts
import { defineConfig } from "vite";
import dol from "data-of-loathing/vite";

export default defineConfig({
  plugins: [dol()],
});
```

The plugin excludes the package and its SQLite WASM dependency from Vite's dependency optimiser, which is required for the worker URLs to resolve correctly. It also polyfills `Buffer`.

If your deployment needs [cross-origin isolation headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Embedder-Policy) for other reasons, pass `{ coi: true }` to enable them on the dev server:

```ts
plugins: [dol({ coi: true })]
```

## Querying

After `await client.load()`, `client.query` is a MikroORM `EntityManager`. The full MikroORM querying API is available, but the most common patterns are:

```ts
const em = client.query;

// find one record
const item = await em.findOne("Item", { name: "seal tooth" });

// find multiple records
const familiars = await em.findAll("Familiar", {
  where: { category: FamiliarCategory.Combat },
  orderBy: { name: "asc" },
});

// find with a limit
const skills = await em.find("Skill", {}, { limit: 10 });
```

## Entities

The following entities are available to query:

- `Item` - in-game items
- `Effect` - status effects
- `Skill` - skills usable by players
- `Familiar` - familiars
- `Monster` - monsters
- `MonsterDrop` - individual item drops from monsters (relates `Monster` to `Item`)
- `NativeMonster` - monsters that appear natively in a location (relates `Location` to `Monster`)
- `Location` - in-game locations
- `Path` - challenge paths
- `AscensionClass` - player classes
- `Equipment` - equipment items, with slot and stat requirements
- `Consumable` - food and booze
- `Concoction` - craftable items
- `Ingredient` - ingredients for a concoction (relates `Concoction` to `Item`)
- `Outfit` - outfits
- `OutfitTreat` - the items that make up an outfit (relates `Outfit` to `Item`)
- `FoldGroup` - groups of items that can be folded into each other
- `ZapGroup` - groups of items that can be zapped into each other
- `ItemModifiers` - numeric modifiers for an item (one-to-one with `Item`)
- `EffectModifiers` - numeric modifiers for an effect (one-to-one with `Effect`)
- `SkillModifiers` - numeric modifiers for a skill (one-to-one with `Skill`)
- `FamiliarModifiers` - numeric modifiers for a familiar (one-to-one with `Familiar`)
- `Meta` - metadata about the database, including the last update timestamp

Enum types for filtering (`ItemUse`, `EffectQuality`, `SkillTag`, `FamiliarCategory`, `MonsterElement`, and others) are exported from the package alongside the entity types.

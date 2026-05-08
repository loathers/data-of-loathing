# Migrating from data-of-loathing v2 to v3

## What changed

v2 used a GenQL-generated GraphQL client against a PostGraphile API at `data.loathers.net/graphql`.
v3 ships an embedded SQLite database via MikroORM. The database file is downloaded once (ETag-cached) and queried locally.

## Install

```sh
# Remove the old implicit peer dep (genql was used internally; nothing to uninstall consumer-side)
# Add the new peer dep required by the Vite plugin:
npm install -D vite-plugin-node-polyfills
# Or with yarn:
yarn add -D vite-plugin-node-polyfills
```

Update `data-of-loathing` to `^3.0.0`.

## Vite config

Add the `dol()` plugin. It excludes the SQLite WASM from pre-bundling and polyfills `Buffer`.

```ts
// vite.config.ts  (before)
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({ plugins: [react()] });

// vite.config.ts  (after)
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dol from "data-of-loathing/vite";
export default defineConfig({ plugins: [react(), dol()] });
```

If you use the `"opfs"` browser strategy you also need cross-origin isolation headers.
Pass `dol({ coi: true })` to enable them on the dev server, and set them at the hosting layer in production.

## Client initialisation

```ts
// v2
import { createClient } from "data-of-loathing";
const client = createClient();
// client is ready to query immediately

// v3
import { createClient } from "data-of-loathing";
const client = createClient();       // browser defaults to "memory" strategy
await client.load();                 // downloads + opens the SQLite database
// client.query is now an EntityManager
```

`createClient()` with no arguments works for both the Node build (downloads to `~/.cache/data-of-loathing/`) and the browser build (holds the DB in WASM memory). Explicit strategies:

| Environment | Strategy arg | Behaviour |
|-------------|-------------|-----------|
| Node | `{ strategy: "url" }` | Download + cache in `~/.cache/data-of-loathing/` |
| Node | `{ strategy: "local", path }` | Open a local file |
| Browser | `{ strategy: "memory" }` | Download into WASM memory each page load |
| Browser | `{ strategy: "opfs" }` | Download once into Origin Private FS (persistent) |
| Browser | `{ strategy: "ranged" }` | HTTP range requests; never fetches the full file |

> **TypeScript note:** the package's `"types"` export always resolves to the Node types. TypeScript will therefore only accept Node strategies at the type level. Using `createClient()` (no args) sidesteps this: both Node and browser accept an empty-object default.

## Query API

v2 used GraphQL field-selection objects. v3 uses MikroORM's `EntityManager` directly.

```ts
// v2 — fetch all effects with their modifiers
const result = await client.query({
  allEffects: {
    nodes: {
      id: true,
      name: true,
      image: true,
      effectModifierByEffect: { modifiers: true },
    },
    __args: { orderBy: ["ID_ASC"] },
  },
});
const effects = result.allEffects?.nodes.filter(Boolean);

// v3
import { Effect } from "data-of-loathing";
const effects = await client.query.find(
  Effect,
  {},                                        // where (empty = all)
  { orderBy: { id: "ASC" }, populate: ["modifiers"] },
);
```

Filter to a set of IDs:
```ts
// v2
.filter((e) => validIds.includes(e.id))

// v3 — push the filter into the database
await client.query.find(Effect, { id: { $in: validIds } }, { orderBy: { id: "ASC" }, populate: ["modifiers"] })
```

## Entity shape changes

| Field (v2) | Field (v3) | Notes |
|-----------|-----------|-------|
| `effect.effectModifierByEffect?.modifiers` | `effect.modifiers?.modifiers` | Relation renamed; `modifiers` is `Record<string, string>` in both |

In v3 each entity's optional relations are `undefined` unless you pass `populate` (or `populate: true` for all). The `modifiers` field is the nested `Record<string, string>` on the `EffectModifiers` / `ItemModifiers` / etc. entity:

```ts
// Access modifiers
const mods: Record<string, string> | undefined = effect.modifiers?.modifiers;
```

## Available entities

All entities are exported from `"data-of-loathing"`:
`Item`, `Effect`, `Skill`, `Familiar`, `Monster`, `Location`, `Path`, `AscensionClass`,
`Equipment`, `Consumable`, `Concoction`, `Outfit`, `FoldGroup`, `ZapGroup`,
`ItemModifiers`, `EffectModifiers`, `SkillModifiers`, `FamiliarModifiers`, `Meta`

## TypeScript import style

With `verbatimModuleSyntax` enabled, import entity classes as values (not `import type`) when passing them to `find()`:

```ts
import { createClient, Effect } from "data-of-loathing"; // value import — needed for find()
export type { Effect };                                   // re-export as type for consumers
```

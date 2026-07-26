# data-of-loathing-mcp

An [MCP](https://modelcontextprotocol.io) server that exposes Kingdom of Loathing
game data to LLM agents like Claude. It wraps the
[`data-of-loathing`](../client) client, so it downloads and ETag-caches the SQLite
database from [data.loathers.net](https://data.loathers.net) automatically — no
setup or API key required.

Once connected you can ask things like _"what's the autosell value of a seal
tooth?"_, _"list combat familiars"_, or _"what modifiers does a Mayonnaise Clinic
grant?"_ and the agent will query the data directly.

## Add it to Claude

### Claude Code (CLI)

```sh
claude mcp add data-of-loathing -- npx -y data-of-loathing-mcp@next
```

Then check it connected with `claude mcp list`.

### Claude Desktop

Open **Settings → Developer → Edit Config** (or edit
`claude_desktop_config.json` directly) and add:

```json
{
  "mcpServers": {
    "data-of-loathing": {
      "command": "npx",
      "args": ["-y", "data-of-loathing-mcp@next"]
    }
  }
}
```

Restart Claude Desktop. The tools appear under the 🔌 icon.

### From a local checkout

If you are hacking on this repo instead of using the published package, point the
config at the built entry point (run `yarn workspace data-of-loathing-mcp build`
first, or use `src/index.ts` via `tsx` for live development):

```json
{
  "mcpServers": {
    "data-of-loathing": {
      "command": "node",
      "args": ["/absolute/path/to/data-of-loathing/packages/mcp/dist/index.js"]
    }
  }
}
```

## Tools

- `list_entities` — list the queryable entities and what each contains.
- `find_<entity>` — one per core entity (`find_item`, `find_familiar`,
  `find_monster`, `find_skill`, …). Each accepts a typed `where` filter over that
  entity's scalar fields, plus `orderBy`, `orderDirection`, `limit`, and `offset`.
  String filters are case-insensitive partial matches; JSON-array fields (e.g.
  `Item.uses`, `Familiar.categories`) match rows whose array includes any of the
  given values.
  - **Related records travel together.** One-to-one/parent records are always
    included and filterable via nested filters. A 1:1 table like `Consumable` is
    just optional extra fields on an item, so `find_item` returns the item's
    `consumable` inline, and `find_consumable` can filter by
    `where: { item: { name: "fleetwood mac 'n' cheese" } }` and returns the item
    alongside. Larger collections (e.g. an item's `monsterDrops`) are opt-in via a
    `populate` argument.
- `get_modifiers` — the game modifiers (Muscle, Meat Drop, …) attached to an Item,
  Effect, Skill, Familiar, or Outfit, looked up by name or id.

## Configuration

Set `DOL_SQLITE_PATH` to point at a local `.sqlite` file instead of downloading
from data.loathers.net (useful offline or in development):

```json
{
  "mcpServers": {
    "data-of-loathing": {
      "command": "npx",
      "args": ["-y", "data-of-loathing-mcp@next"],
      "env": { "DOL_SQLITE_PATH": "/path/to/dol.sqlite" }
    }
  }
}
```

## Development

```sh
yarn workspace data-of-loathing-mcp start   # run over stdio (via tsx)
yarn workspace data-of-loathing-mcp build   # bundle to dist/ for publishing
yarn workspace data-of-loathing-mcp test    # vitest
```

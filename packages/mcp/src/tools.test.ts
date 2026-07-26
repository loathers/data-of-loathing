import { existsSync } from "node:fs";
import { join } from "node:path";
import envPaths from "env-paths";
import { beforeAll, describe, expect, test } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createClient, type Client } from "data-of-loathing";
import {
  registerTools,
  relevance,
  scalarFields,
  splitWhere,
  type ScalarField,
} from "./tools.js";
import { CORE_ENTITIES } from "./entities.js";

// --- relevance (pure, no database) ----------------------------------------

test("relevance ranks exact over prefix over substring, ignoring punctuation", () => {
  expect(relevance("fleetwood mac 'n' cheese", "fleetwood mac n cheese")).toBe(
    0,
  );
  expect(relevance("cheese wheel", "cheese")).toBe(1);
  expect(relevance("stinky cheese", "cheese")).toBe(2);
});

// --- splitWhere (pure, no database) ---------------------------------------

const fields: ScalarField[] = [
  { name: "name", kind: "string" },
  { name: "autosell", kind: "number" },
  { name: "tradeable", kind: "boolean" },
  { name: "uses", kind: "json" },
];
const noRelations = new Set<string>();

test("splitWhere turns string filters into case-insensitive partial matches", () => {
  const { dbWhere } = splitWhere(fields, noRelations, { name: "seal" });
  expect(dbWhere).toEqual({ name: { $like: "%seal%" } });
});

test("splitWhere passes numbers and booleans through as equality", () => {
  const { dbWhere } = splitWhere(fields, noRelations, {
    autosell: 1,
    tradeable: true,
  });
  expect(dbWhere).toEqual({ autosell: 1, tradeable: true });
});

test("splitWhere pulls JSON-array columns out for post-filtering", () => {
  const { dbWhere, jsonWhere } = splitWhere(fields, noRelations, {
    name: "tooth",
    uses: ["smith"],
  });
  expect(dbWhere).toEqual({ name: { $like: "%tooth%" } });
  expect(jsonWhere).toEqual({ uses: ["smith"] });
});

test("splitWhere turns whitespace into wildcards to tolerate punctuation", () => {
  const { dbWhere } = splitWhere(fields, noRelations, {
    name: "fleetwood mac n cheese",
  });
  // Matches "fleetwood mac 'n' cheese" despite the apostrophes.
  expect(dbWhere).toEqual({ name: { $like: "%fleetwood%mac%n%cheese%" } });
});

test("splitWhere applies partial matching inside nested relation filters", () => {
  const { dbWhere } = splitWhere(fields, new Set(["item"]), {
    item: { name: "fleetwood mac", autosell: 0 },
  });
  expect(dbWhere).toEqual({
    item: { name: { $like: "%fleetwood%mac%" }, autosell: 0 },
  });
});

test("splitWhere ignores undefined values", () => {
  const { dbWhere, jsonWhere } = splitWhere(fields, noRelations, {
    name: undefined,
  });
  expect(dbWhere).toEqual({});
  expect(jsonWhere).toEqual({});
});

// --- database-backed tests ------------------------------------------------
// These use the client's cached database if present. In CI (no cache) they are
// skipped rather than downloading a multi-megabyte file during unit tests.

const cachedDb = join(envPaths("data-of-loathing").cache, "dol.sqlite");
const hasDb = existsSync(cachedDb);

describe.skipIf(!hasDb)("with the cached database", () => {
  let client: Client;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let tools: Record<string, any>;

  beforeAll(async () => {
    client = createClient({ strategy: "local", path: cachedDb });
    await client.load();
    const server = new McpServer({ name: "test", version: "0" });
    registerTools(server, client);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tools = (server as any)._registeredTools;
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const call = async (name: string, args: any) => {
    const result = await tools[name].handler(args, {});
    return JSON.parse(result.content[0].text);
  };

  test("registers a find tool per core entity plus helpers", () => {
    for (const entity of Object.keys(CORE_ENTITIES)) {
      expect(tools[`find_${entity.toLowerCase()}`]).toBeDefined();
    }
    expect(tools["list_entities"]).toBeDefined();
    expect(tools["get_modifiers"]).toBeDefined();
    // Internal modifier/pivot entities are not exposed.
    expect(tools["find_itemmodifiers"]).toBeUndefined();
    expect(tools["find_meta"]).toBeUndefined();
    // 1:1 extension tables are folded into find_item, not their own tools.
    expect(tools["find_consumable"]).toBeUndefined();
    expect(tools["find_equipment"]).toBeUndefined();
  });

  test("scalarFields includes scalar columns and excludes relations", () => {
    const names = scalarFields(client, "Item").map((f) => f.name);
    expect(names).toContain("name");
    expect(names).toContain("autosell");
    expect(names).toContain("uses");
    // Relations are excluded.
    expect(names).not.toContain("equipment");
    expect(names).not.toContain("monsterDrops");
  });

  test("classifies the uses column as a JSON array", () => {
    const uses = scalarFields(client, "Item").find((f) => f.name === "uses");
    expect(uses?.kind).toBe("json");
  });

  test("find_item resolves the seal tooth by partial name", async () => {
    const rows = await call("find_item", { where: { name: "seal tooth" } });
    const seal = rows.find((r: { name: string }) => r.name === "seal tooth");
    expect(seal?.autosell).toBe(1);
  });

  test("find_item orders name matches by relevance", async () => {
    const rows = await call("find_item", {
      where: { name: "cheese" },
      limit: 50,
    });
    const scores = rows.map((r: { name: string }) =>
      relevance(r.name, "cheese"),
    );
    // Non-decreasing: exact/prefix matches come before looser substring matches.
    expect(scores).toEqual([...scores].sort((a, b) => a - b));
  });

  test("find_familiar filters on a JSON-array category", async () => {
    const rows = await call("find_familiar", {
      where: { categories: ["combat0"] },
    });
    expect(rows.length).toBeGreaterThan(0);
    expect(
      rows.every((r: { categories: string[] }) =>
        r.categories.includes("combat0"),
      ),
    ).toBe(true);
  });

  test("limit caps the number of returned rows", async () => {
    const rows = await call("find_item", { limit: 3 });
    expect(rows).toHaveLength(3);
  });

  test("get_modifiers returns modifiers for a known item", async () => {
    const result = await call("get_modifiers", {
      entity: "Item",
      name: "seal tooth",
    });
    expect(Array.isArray(result.modifiers)).toBe(true);
    expect(result.name).toBe("seal tooth");
  });

  test("find_item filters by a nested consumable field", async () => {
    const rows = await call("find_item", {
      where: { consumable: { quality: "awesome" } },
      limit: 5,
    });
    expect(rows.length).toBeGreaterThan(0);
    expect(
      rows.every(
        (r: { consumable: { quality: string } }) =>
          r.consumable?.quality === "awesome",
      ),
    ).toBe(true);
  });

  test("find_item includes its 1:1 consumable record automatically", async () => {
    const rows = await call("find_item", {
      where: { name: "fleetwood mac n cheese" },
    });
    const item = rows.find((r: { name: string }) =>
      r.name.includes("fleetwood mac"),
    );
    expect(item?.consumable?.stomach).toBe(6);
  });

  test("collections are excluded unless requested via populate", async () => {
    const [plain] = await call("find_item", { where: { name: "seal tooth" } });
    expect(plain.monsterDrops).toBeUndefined();
    const [withDrops] = await call("find_item", {
      where: { name: "seal tooth" },
      populate: ["monsterDrops"],
    });
    expect(Array.isArray(withDrops.monsterDrops)).toBe(true);
  });
});

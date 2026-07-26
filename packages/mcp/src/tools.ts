import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { type Client } from "data-of-loathing";
import { CORE_ENTITIES, FIELD_ENUMS } from "./entities.js";

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 200;
// When a query filters on a JSON-array column we post-filter in JS, so cap how
// many rows we pull from the database before filtering to avoid unbounded reads.
const JSON_SCAN_CAP = 2000;

// Entities that carry a `modifiers` relation (the HasModifiers union in the client).
const MODIFIER_ENTITIES = [
  "Item",
  "Effect",
  "Skill",
  "Familiar",
  "Outfit",
] as const;

type ScalarKind = "string" | "number" | "boolean" | "json";

export type ScalarField = {
  name: string;
  kind: ScalarKind;
  /** Allowed enum values, if this column is backed by an enum. */
  enumValues?: string[];
};

type Relation = {
  name: string;
  /** The related entity's class name. */
  target: string;
  /** True for 1:1 / m:1 (a single related record), false for 1:m / m:n. */
  toOne: boolean;
  /** Scalar fields of the target, used to serialize and to build nested filters. */
  targetFields: ScalarField[];
};

function classifyType(
  columnType: string | undefined,
  runtimeType: string,
): ScalarKind {
  // JSON columns resolve to type "JsonType" / runtimeType "any", so key off the column type.
  if (columnType === "json") return "json";
  if (runtimeType === "boolean") return "boolean";
  if (runtimeType === "number") return "number";
  return "string";
}

/** Read the scalar (non-relation) fields of an entity from MikroORM metadata. */
export function scalarFields(
  client: Client,
  entityName: string,
): ScalarField[] {
  // Entity names are dynamic strings; MikroORM's branded EntityName type needs a cast.
  const meta = client.query.getMetadata().get(entityName as never);
  return meta.props
    .filter((prop) => String(prop.kind) === "scalar")
    .map((prop) => ({
      name: prop.name,
      kind: classifyType(prop.columnTypes?.[0], String(prop.runtimeType)),
      enumValues: FIELD_ENUMS[`${entityName}.${prop.name}`],
    }));
}

/**
 * Read an entity's relations. To-one relations (1:1 and m:1) are treated as
 * "structured extra fields": a Consumable is really just optional columns on an
 * Item, so we always pull the related record alongside — in both directions.
 * Collections (1:m / m:n) are larger and only included on request.
 */
export function relationsOf(client: Client, entityName: string): Relation[] {
  const meta = client.query.getMetadata().get(entityName as never);
  return (
    meta.props
      .filter((prop) => String(prop.kind) !== "scalar")
      // Skip MikroORM's auto-generated inverse pivot properties (e.g. `X__inverse`).
      .filter((prop) => !prop.name.includes("__"))
      .map((prop) => {
        const kind = String(prop.kind);
        const target = String(prop.type);
        return {
          name: prop.name,
          target,
          toOne: kind === "1:1" || kind === "m:1",
          targetFields: scalarFields(client, target),
        };
      })
  );
}

function describeField(field: ScalarField): string {
  if (field.enumValues) {
    const values = field.enumValues.map((v) => `"${v}"`).join(", ");
    return field.kind === "json"
      ? `Match rows whose ${field.name} array includes any of: ${values}.`
      : `One of: ${values}.`;
  }
  if (field.kind === "string")
    return "Case-insensitive partial match (substring).";
  if (field.kind === "json")
    return "Match rows whose array includes any of these values.";
  return "Exact match.";
}

function fieldSchema(field: ScalarField): z.ZodTypeAny {
  switch (field.kind) {
    case "boolean":
      return z.boolean();
    case "number":
      return z.number();
    case "json":
      return z.array(z.string());
    default:
      return z.string();
  }
}

/**
 * Build a case-insensitive LIKE pattern. Whitespace becomes a wildcard so word
 * order is kept but punctuation between words is tolerated — "fleetwood mac n
 * cheese" matches "fleetwood mac 'n' cheese".
 */
function likePattern(value: string): string {
  return `%${value.trim().replace(/\s+/g, "%")}%`;
}

/** Strip punctuation/whitespace so "fleetwood mac 'n' cheese" == "fleetwood mac n cheese". */
function normalizeName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Relevance tier for a name against a search term: 0 exact, 1 prefix, 2 substring,
 * 3 non-contiguous (the wildcard LIKE matched but the words aren't adjacent).
 * Lower is better.
 */
export function relevance(candidate: string, query: string): number {
  const c = normalizeName(candidate);
  const q = normalizeName(query);
  if (c === q) return 0;
  if (c.startsWith(q)) return 1;
  if (c.includes(q)) return 2;
  return 3;
}

/** Sort matched rows by relevance to the search term, then shorter, then alphabetical. */
function rankByName(
  rows: Record<string, unknown>[],
  query: string,
): Record<string, unknown>[] {
  return [...rows].sort((a, b) => {
    const na = String(a.name);
    const nb = String(b.name);
    const byRelevance = relevance(na, query) - relevance(nb, query);
    if (byRelevance !== 0) return byRelevance;
    if (na.length !== nb.length) return na.length - nb.length;
    return na.localeCompare(nb);
  });
}

function whereSchema(
  fields: ScalarField[],
  toOneRelations: Relation[],
): z.ZodTypeAny {
  const shape: z.ZodRawShape = {};
  for (const field of fields) {
    shape[field.name] = fieldSchema(field)
      .optional()
      .describe(describeField(field));
  }
  // Nested filters on to-one relations, e.g. `{ item: { name: "seal tooth" } }`.
  // Only non-JSON target fields are exposed (JSON membership can't be joined on).
  for (const relation of toOneRelations) {
    const nested: z.ZodRawShape = {};
    for (const field of relation.targetFields) {
      if (field.kind === "json") continue;
      nested[field.name] = fieldSchema(field)
        .optional()
        .describe(describeField(field));
    }
    shape[relation.name] = z
      .object(nested)
      .strict()
      .optional()
      .describe(`Filter by the related ${relation.target} (e.g. { name }).`);
  }
  // Strict so a misplaced filter (e.g. a top-level `name` on an entity whose name
  // lives on a related record) errors loudly instead of being silently ignored.
  return z
    .object(shape)
    .strict()
    .optional()
    .describe("Filters to apply (AND-combined).");
}

type FindArgs = {
  where?: Record<string, unknown>;
  orderBy?: string;
  orderDirection?: "asc" | "desc";
  limit?: number;
  offset?: number;
  populate?: string[];
};

/** Apply the case-insensitive partial-match transform to nested string filters. */
function mapNestedStrings(
  value: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value)) {
    if (val === undefined) continue;
    out[key] = typeof val === "string" ? { $like: likePattern(val) } : val;
  }
  return out;
}

/**
 * Split a user-supplied filter into a database WHERE clause and JSON-array
 * filters that we apply in JS afterwards. String columns become case-insensitive
 * partial matches; nested to-one relation filters get the same treatment; JSON-array
 * columns are pulled out because SQLite JSON membership queries are unreliable.
 */
export function splitWhere(
  fields: ScalarField[],
  relationNames: Set<string>,
  where: Record<string, unknown>,
): { dbWhere: Record<string, unknown>; jsonWhere: Record<string, string[]> } {
  const jsonFieldNames = new Set(
    fields.filter((f) => f.kind === "json").map((f) => f.name),
  );
  const dbWhere: Record<string, unknown> = {};
  const jsonWhere: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(where)) {
    if (value === undefined) continue;
    if (relationNames.has(key) && value && typeof value === "object") {
      dbWhere[key] = mapNestedStrings(value as Record<string, unknown>);
    } else if (jsonFieldNames.has(key)) {
      jsonWhere[key] = value as string[];
    } else if (typeof value === "string") {
      dbWhere[key] = { $like: likePattern(value) };
    } else {
      dbWhere[key] = value;
    }
  }
  return { dbWhere, jsonWhere };
}

/** Serialize an entity to a plain object of just its scalar fields. */
function toPlain(fields: ScalarField[], entity: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const field of fields) out[field.name] = entity[field.name];
  return out;
}

/**
 * Serialize a row: its own scalar fields, every to-one relation (always), and any
 * requested collections. Populated relations are one level deep — the related
 * record's own scalar fields only, no further nesting.
 */
function serializeRow(
  fields: ScalarField[],
  toOneRelations: Relation[],
  collections: Relation[],
  requestedCollections: Set<string>,
  row: Record<string, unknown>,
) {
  const out = toPlain(fields, row);
  for (const relation of toOneRelations) {
    const related = row[relation.name] as Record<string, unknown> | null;
    out[relation.name] = related
      ? toPlain(relation.targetFields, related)
      : null;
  }
  for (const relation of collections) {
    if (!requestedCollections.has(relation.name)) continue;
    const collection = row[relation.name] as {
      getItems?: () => Record<string, unknown>[];
    } | null;
    out[relation.name] =
      collection
        ?.getItems?.()
        .map((item) => toPlain(relation.targetFields, item)) ?? [];
  }
  return out;
}

function textResult(payload: unknown) {
  return {
    content: [
      { type: "text" as const, text: JSON.stringify(payload, null, 2) },
    ],
  };
}

function registerFindTool(
  server: McpServer,
  client: Client,
  entityName: string,
) {
  const fields = scalarFields(client, entityName);
  const scalarNames = fields.map((f) => f.name);
  const relations = relationsOf(client, entityName);
  const toOneRelations = relations.filter((r) => r.toOne);
  const collections = relations.filter((r) => !r.toOne);
  const toOneNames = toOneRelations.map((r) => r.name);
  const collectionNames = collections.map((r) => r.name);
  // Relations that can appear in `where` (to-one only) for nested filtering.
  const relationFilterNames = new Set(toOneNames);

  const includedNote =
    toOneNames.length > 0
      ? ` Always includes the related ${toOneNames.join(", ")}.`
      : "";
  const populateNote =
    collectionNames.length > 0
      ? ` Request related collections (${collectionNames.join(", ")}) with populate.`
      : "";

  // Entities like Consumable/Equipment have no name of their own — steer callers
  // to filter by the related record that does (usually the item).
  const hasOwnName = scalarNames.includes("name");
  const namedRelation = toOneRelations.find((r) =>
    r.targetFields.some((f) => f.name === "name"),
  );
  const nameHint =
    !hasOwnName && namedRelation
      ? ` This record has no name of its own — look it up via its ${namedRelation.name}, e.g. where: { ${namedRelation.name}: { name: "..." } }.`
      : "";

  const inputSchema: z.ZodRawShape = {
    where: whereSchema(fields, toOneRelations),
    orderBy: z
      .enum(scalarNames as [string, ...string[]])
      .optional()
      .describe("Field to sort by."),
    orderDirection: z.enum(["asc", "desc"]).optional(),
    limit: z
      .number()
      .int()
      .min(1)
      .max(MAX_LIMIT)
      .optional()
      .describe(
        `Max rows to return (default ${DEFAULT_LIMIT}, max ${MAX_LIMIT}).`,
      ),
    offset: z.number().int().min(0).optional(),
  };
  if (collectionNames.length > 0) {
    inputSchema.populate = z
      .array(z.enum(collectionNames as [string, ...string[]]))
      .optional()
      .describe("Related collections to include in the output.");
  }

  server.registerTool(
    `find_${entityName.toLowerCase()}`,
    {
      description:
        `${CORE_ENTITIES[entityName]} Put filters in a \`where\` object keyed by field ` +
        `(${scalarNames.join(", ")}); unknown keys are rejected. Filter related records ` +
        `with nested filters, e.g. where: { item: { name: "seal tooth" } }.` +
        `${nameHint}${includedNote}${populateNote}`,
      inputSchema,
    },
    async (rawArgs) => {
      const args = rawArgs as FindArgs;
      const em = client.query.fork();
      const { dbWhere, jsonWhere } = splitWhere(
        fields,
        relationFilterNames,
        args.where ?? {},
      );

      const requestedCollections = new Set(
        (args.populate ?? []).filter((name) => collectionNames.includes(name)),
      );
      const populate = [...toOneNames, ...requestedCollections];

      const limit = args.limit ?? DEFAULT_LIMIT;
      const offset = args.offset ?? 0;
      const orderBy = args.orderBy
        ? { [args.orderBy]: args.orderDirection ?? "asc" }
        : undefined;
      const jsonKeys = Object.keys(jsonWhere);

      // When searching by name without an explicit sort, order the matches by
      // relevance (exact > prefix > substring) so the intended item comes first.
      const nameQuery =
        !args.orderBy && typeof args.where?.name === "string"
          ? args.where.name
          : undefined;

      let rows: Record<string, unknown>[];
      if (jsonKeys.length === 0 && nameQuery === undefined) {
        rows = (await em.find(entityName as never, dbWhere, {
          populate: populate as never,
          orderBy,
          limit,
          offset,
        })) as Record<string, unknown>[];
      } else {
        // Pull a bounded set matching the scalar filters, then apply JS-side JSON
        // filtering and/or relevance ranking (neither is expressible in SQL here),
        // then page.
        let candidates = (await em.find(entityName as never, dbWhere, {
          populate: populate as never,
          orderBy,
          limit: JSON_SCAN_CAP,
        })) as Record<string, unknown>[];
        if (jsonKeys.length > 0) {
          candidates = candidates.filter((row) =>
            jsonKeys.every((key) => {
              const arr = row[key];
              if (!Array.isArray(arr)) return false;
              return jsonWhere[key].some((wanted) => arr.includes(wanted));
            }),
          );
        }
        if (nameQuery !== undefined)
          candidates = rankByName(candidates, nameQuery);
        rows = candidates.slice(offset, offset + limit);
      }

      return textResult(
        rows.map((row) =>
          serializeRow(
            fields,
            toOneRelations,
            collections,
            requestedCollections,
            row,
          ),
        ),
      );
    },
  );
}

function registerListEntities(server: McpServer) {
  server.registerTool(
    "list_entities",
    {
      description:
        "List the queryable game-data entities and what each contains. Use this to discover which find_<entity> tool to call.",
      inputSchema: {},
    },
    async () => textResult(CORE_ENTITIES),
  );
}

function registerGetModifiers(server: McpServer, client: Client) {
  server.registerTool(
    "get_modifiers",
    {
      description:
        "Get the numeric/game modifiers (e.g. Muscle, Meat Drop, Spooky Damage) attached to an Item, Effect, Skill, Familiar, or Outfit. Look up by exact name or id.",
      inputSchema: {
        entity: z
          .enum(MODIFIER_ENTITIES)
          .describe("Which entity type to look up."),
        name: z.string().optional().describe("Exact name of the record."),
        id: z.number().int().optional().describe("Numeric id of the record."),
      },
    },
    async (rawArgs) => {
      const args = rawArgs as {
        entity: (typeof MODIFIER_ENTITIES)[number];
        name?: string;
        id?: number;
      };
      if (args.name === undefined && args.id === undefined) {
        return textResult({ error: "Provide either name or id." });
      }
      const em = client.query.fork();
      const where =
        args.id !== undefined ? { id: args.id } : { name: args.name };
      const record = (await em.findOne(args.entity as never, where, {
        populate: ["modifiers"],
      })) as {
        name?: string;
        id?: number;
        modifiers?: { modifiers?: unknown };
      } | null;

      if (!record) return textResult({ error: "No matching record found." });
      return textResult({
        entity: args.entity,
        name: record.name,
        id: record.id,
        modifiers: record.modifiers?.modifiers ?? [],
      });
    },
  );
}

export function registerTools(server: McpServer, client: Client) {
  registerListEntities(server);
  for (const entityName of Object.keys(CORE_ENTITIES)) {
    registerFindTool(server, client, entityName);
  }
  registerGetModifiers(server, client);
}

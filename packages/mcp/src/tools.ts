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

/**
 * Split a user-supplied filter into a database WHERE clause and JSON-array
 * filters that we apply in JS afterwards. String columns become case-insensitive
 * partial matches; JSON-array columns (uses/tags/categories) are pulled out
 * because SQLite JSON membership queries are unreliable.
 */
export function splitWhere(
  fields: ScalarField[],
  where: Record<string, unknown>,
): { dbWhere: Record<string, unknown>; jsonWhere: Record<string, string[]> } {
  const jsonFieldNames = new Set(
    fields.filter((f) => f.kind === "json").map((f) => f.name),
  );
  const dbWhere: Record<string, unknown> = {};
  const jsonWhere: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(where)) {
    if (value === undefined) continue;
    if (jsonFieldNames.has(key)) {
      jsonWhere[key] = value as string[];
    } else if (typeof value === "string") {
      dbWhere[key] = { $like: `%${value}%` };
    } else {
      dbWhere[key] = value;
    }
  }
  return { dbWhere, jsonWhere };
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

function whereSchema(fields: ScalarField[]): z.ZodTypeAny {
  const shape: z.ZodRawShape = {};
  for (const field of fields) {
    let schema: z.ZodTypeAny;
    switch (field.kind) {
      case "boolean":
        schema = z.boolean();
        break;
      case "number":
        schema = z.number();
        break;
      case "json":
        schema = z.array(z.string());
        break;
      default:
        schema = z.string();
    }
    shape[field.name] = schema.optional().describe(describeField(field));
  }
  return z
    .object(shape)
    .optional()
    .describe("Filters to apply (AND-combined).");
}

type FindArgs = {
  where?: Record<string, unknown>;
  orderBy?: string;
  orderDirection?: "asc" | "desc";
  limit?: number;
  offset?: number;
};

/** Serialize an entity to a plain object of just its scalar fields. */
function toPlain(fields: ScalarField[], entity: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const field of fields) out[field.name] = entity[field.name];
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

  server.registerTool(
    `find_${entityName.toLowerCase()}`,
    {
      description: `${CORE_ENTITIES[entityName]} Filterable fields: ${scalarNames.join(", ")}.`,
      inputSchema: {
        where: whereSchema(fields),
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
      },
    },
    async (rawArgs) => {
      const args = rawArgs as FindArgs;
      const em = client.query.fork();
      const { dbWhere, jsonWhere } = splitWhere(fields, args.where ?? {});

      const limit = args.limit ?? DEFAULT_LIMIT;
      const offset = args.offset ?? 0;
      const orderBy = args.orderBy
        ? { [args.orderBy]: args.orderDirection ?? "asc" }
        : undefined;
      const jsonKeys = Object.keys(jsonWhere);

      let rows: Record<string, unknown>[];
      if (jsonKeys.length === 0) {
        rows = (await em.find(entityName as never, dbWhere, {
          orderBy,
          limit,
          offset,
        })) as Record<string, unknown>[];
      } else {
        // Pull a bounded set matching the scalar filters, then filter the JSON
        // arrays in JS (SQLite JSON membership queries are unreliable), then page.
        const candidates = (await em.find(entityName as never, dbWhere, {
          orderBy,
          limit: JSON_SCAN_CAP,
        })) as Record<string, unknown>[];
        const matched = candidates.filter((row) =>
          jsonKeys.every((key) => {
            const arr = row[key];
            if (!Array.isArray(arr)) return false;
            return jsonWhere[key].some((wanted) => arr.includes(wanted));
          }),
        );
        rows = matched.slice(offset, offset + limit);
      }

      return textResult(rows.map((row) => toPlain(fields, row)));
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

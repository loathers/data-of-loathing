import { MikroORM } from "@mikro-orm/core";
import { NodeSqliteDialect, SqliteDriver, SqlMikroORM } from "@mikro-orm/sql";
import { entities } from "data-of-loathing";

let orm: MikroORM;

function em() {
  return orm.em;
}

function conn() {
  return orm.em.getConnection();
}

export async function openDatabase(path: string) {
  orm = await SqlMikroORM.init({
    driver: SqliteDriver,
    driverOptions: new NodeSqliteDialect(path),
    dbName: path,
    entities,
    allowGlobalContext: true,
  });
}

export async function initialiseDatabase() {
  await orm.schema.drop();
  await orm.schema.create();
}

function serializeValue(value: unknown): unknown {
  if (value === null || value === undefined) return null;
  if (typeof value === "boolean") return value ? 1 : 0;
  if (Array.isArray(value) || (typeof value === "object" && value !== null))
    return JSON.stringify(value);
  return value;
}

function deserializeRow(row: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(row).map(([k, v]) => {
      if (typeof v === "string" && (v.startsWith("[") || v.startsWith("{"))) {
        try {
          return [k, JSON.parse(v)];
        } catch {
          return [k, v];
        }
      }
      return [k, v];
    }),
  );
}

export async function checkExists(
  tableName: string,
  columnName: string,
  value: string,
): Promise<boolean> {
  const rows = await conn().execute<unknown[]>(
    `SELECT 1 FROM "${tableName}" WHERE "${columnName}" = ? LIMIT 1`,
    [value],
    "all",
  );
  return rows.length > 0;
}

export async function populateEntity<T extends Record<string, unknown>>(
  loader: (() => Promise<T[]>) | T[],
  Entity: new (...args: any[]) => any,
  transform?: (datum: T) => Promise<Record<string, unknown> | null>,
) {
  const data = Array.isArray(loader) ? loader : await loader();
  const transformed = transform
    ? (await Promise.all(data.map((d) => transform(d)))).filter(
        (d) => d !== null,
      )
    : data;
  if (transformed.length === 0) return;
  await em().insertMany(Entity, transformed);
}

// For pure M2M pivot tables that have no entity class.
export async function populatePivot(
  table: string,
  columns: string[],
  rows: Record<string, unknown>[],
) {
  if (rows.length === 0) return;
  const c = conn();
  const cols = columns.map((n) => `"${n}"`).join(", ");
  const placeholders = columns.map(() => "?").join(", ");
  await c.execute("BEGIN");
  for (const row of rows) {
    await c.execute(
      `INSERT INTO "${table}" (${cols}) VALUES (${placeholders})`,
      columns.map((col) => serializeValue(row[col])),
      "run",
    );
  }
  await c.execute("COMMIT");
}

const referenceCache = new Map<string, number | null>();

export async function resolveReference<T extends { id: number }>(
  source: string,
  tableName: string,
  columnName: string,
  name: string | null,
  caseInsensitive = false,
  find?: (row: T) => boolean,
): Promise<number | null> {
  if (name === null) return null;
  const idPrefix = name.match(/^\[(\d+)]/);
  if (idPrefix) return Number(idPrefix[1]);

  const cacheKey = `${tableName}.${columnName}=${name}`;
  if (referenceCache.has(cacheKey)) return referenceCache.get(cacheKey)!;

  const operator = caseInsensitive ? "LIKE" : "=";
  const raw = await conn().execute<Record<string, unknown>[]>(
    `SELECT * FROM "${tableName}" WHERE "${columnName}" ${operator} ?`,
    [name],
    "all",
  );
  const results = raw.map(deserializeRow);

  if (results.length < 1) {
    console.log(
      `Could not find ${tableName} with ${columnName} "${name}" when resolving reference for ${source}`,
    );
    referenceCache.set(cacheKey, null);
  } else {
    let index = results.length - 1;
    if (results.length > 1) {
      const found = find ? results.findIndex(find) : -1;
      if (found >= 0) {
        index = found;
      } else {
        console.log(
          `Could not disambiguate multiple ${tableName} with ${columnName} "${name}", using last`,
        );
      }
    }
    referenceCache.set(cacheKey, results[index].id);
  }

  return referenceCache.get(cacheKey)!;
}

export async function markAmbiguous(tableName: string) {
  await conn().execute(
    `UPDATE "${tableName}" SET "ambiguous" = 1
     WHERE "name" IN (
       SELECT "name" FROM "${tableName}" GROUP BY "name" HAVING COUNT(*) > 1
     )`,
    [],
    "run",
  );
}

export async function prepareMeta() {
  await conn().execute(
    `INSERT OR IGNORE INTO "meta" ("id", "last_update", "last_revision") VALUES (1, 0, 0)`,
    [],
    "run",
  );
}

export async function getLastUpdate(): Promise<Date> {
  const rows = await conn().execute<{ last_update: number }[]>(
    `SELECT "last_update" FROM "meta" WHERE "id" = 1`,
    [],
    "all",
  );
  return new Date((rows[0]?.last_update ?? 0) * 1000);
}

export async function setLastUpdate(date: Date) {
  await conn().execute(
    `UPDATE "meta" SET "last_update" = ? WHERE "id" = 1`,
    [Math.floor(date.getTime() / 1000)],
    "run",
  );
}

export async function setLastRevision(revision: number) {
  await conn().execute(
    `UPDATE "meta" SET "last_revision" = ? WHERE "id" = 1`,
    [revision],
    "run",
  );
}

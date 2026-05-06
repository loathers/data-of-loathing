import Database from "better-sqlite3";
import { drizzle, BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import {
  generateSQLiteDrizzleJson,
  generateSQLiteMigration,
} from "drizzle-kit/api";
import * as schema from "data-of-loathing-schema";
import { eq } from "drizzle-orm";
import { meta } from "data-of-loathing-schema";

export type DB = BetterSQLite3Database<typeof schema>;

let _sqlite: Database.Database;
let _db: DB;

export function openDatabase(path: string) {
  _sqlite = new Database(path);
  _db = drizzle(_sqlite, { schema });
}

export function getDb(): DB {
  return _db;
}

export async function initialiseDatabase() {
  const [emptySnapshot, currentSnapshot] = await Promise.all([
    generateSQLiteDrizzleJson({}),
    generateSQLiteDrizzleJson(schema),
  ]);
  const statements = await generateSQLiteMigration(emptySnapshot, currentSnapshot);
  for (const statement of statements) {
    _sqlite.exec(statement);
  }
}

function serializeValue(value: unknown): unknown {
  if (value === null || value === undefined) return null;
  if (typeof value === "boolean") return value ? 1 : 0;
  if (Array.isArray(value) || (typeof value === "object" && value !== null))
    return JSON.stringify(value);
  return value;
}

function deserializeRow(
  row: Record<string, unknown>,
): Record<string, unknown> {
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

const referenceCache = new Map<string, number | null>();

const referenceCacheKey = (
  tableName: string,
  columnName: string,
  name: string,
) => `${tableName}.${columnName}=${name}`;

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

  const cacheKey = referenceCacheKey(tableName, columnName, name);

  if (!referenceCache.has(cacheKey)) {
    const query = caseInsensitive
      ? `SELECT * FROM "${tableName}" WHERE "${columnName}" = ? COLLATE NOCASE`
      : `SELECT * FROM "${tableName}" WHERE "${columnName}" = ?`;

    const raw = _sqlite.prepare(query).all(name) as Record<string, unknown>[];
    const results = raw.map(deserializeRow) as T[];

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
  }

  return referenceCache.get(cacheKey)!;
}

export async function populateEntity<
  T extends Record<string, unknown>,
  U = Record<keyof T, unknown>,
>(
  loader: (() => Promise<T[]>) | T[],
  tableName: string,
  columns: (keyof T)[],
  transform?: (datum: T) => Promise<U | null>,
) {
  const data = Array.isArray(loader) ? loader : await loader();

  const transformed = transform
    ? (await Promise.all(data.map((d) => transform(d)))).filter(
        (d) => d !== null,
      )
    : data;

  if (transformed.length === 0) return;

  const columnNames = columns.map(String);
  const placeholders = columnNames.map(() => "?").join(", ");
  const stmt = _sqlite.prepare(
    `INSERT INTO "${tableName}" (${columnNames.map((n) => `"${n}"`).join(", ")}) VALUES (${placeholders})`,
  );

  const insertMany = _sqlite.transaction((rows: unknown[]) => {
    for (const row of rows) {
      stmt.run(
        columnNames.map((col) =>
          serializeValue((row as Record<string, unknown>)[col]),
        ),
      );
    }
  });

  insertMany(transformed);
}

export async function markAmbiguous(tableName: string) {
  _sqlite.exec(`
    UPDATE "${tableName}" SET "ambiguous" = 1
    WHERE "name" IN (
      SELECT "name" FROM "${tableName}"
      GROUP BY "name"
      HAVING COUNT(*) > 1
    )
  `);
}

export async function prepareMeta() {
  _db
    .insert(meta)
    .values({
      id: 1,
      lastUpdate: new Date(0),
      lastRevision: 0,
    })
    .onConflictDoNothing()
    .run();
}

export async function getLastUpdate(): Promise<Date> {
  const row = _db.select({ lastUpdate: meta.lastUpdate }).from(meta).get();
  return row?.lastUpdate ?? new Date(0);
}

export async function setLastUpdate(date: Date) {
  _db.update(meta).set({ lastUpdate: date }).where(eq(meta.id, 1)).run();
}

export async function setLastRevision(revision: number) {
  _db
    .update(meta)
    .set({ lastRevision: revision })
    .where(eq(meta.id, 1))
    .run();
}

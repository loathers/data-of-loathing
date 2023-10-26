import postgres from "postgres";
import { stringify } from "csv-stringify";
import { pipeline } from "stream/promises";

export const sql = postgres("postgres://postgres:postgres@localhost:5432");

const referenceCache = new Map<string, number | null>();

const referenceCacheKey = (
  tableName: string,
  columnName: string,
  name: string,
) => `${tableName}.${columnName}=${name}`;

export async function resolveReference(
  tableName: string,
  columnName: string,
  name: string | null,
) {
  // We cast all results to string here just to keep the type system happy.
  // Since the next step is converting to CSV, this is all handled.

  if (name === null) return null as unknown as string;
  const idPrefix = name.match(/^\[(\d+)]/);
  if (idPrefix) return Number(idPrefix[1]) as unknown as string;

  const cacheKey = referenceCacheKey(tableName, columnName, name);
  if (!referenceCache.has(cacheKey)) {
    const results = await sql<{ id: number }[]>`SELECT id FROM ${sql(
      tableName,
    )} WHERE ${sql(columnName)} = ${name}`;

    if (results.length < 1) {
      console.log(`Could not find ${tableName} with ${columnName} "${name}"`);
      referenceCache.set(cacheKey, null);
    } else {
      if (results.length > 1) {
        console.log(
          `Found multiple ${tableName} with ${columnName} "${name}", using last`,
        );
      }

      referenceCache.set(cacheKey, results[results.length - 1].id);
    }
  }

  return referenceCache.get(cacheKey) as unknown as string;
}

export async function populateEntity<
  T extends Record<string, unknown>,
  ColumnsMatch extends boolean = true,
>(
  loader: (() => Promise<{ data: T[] }>) | T[],
  tableName: string,
  columns: [
    columnName: ColumnsMatch extends true ? keyof T : string,
    typeAndConstraints: string,
  ][],
  transform?: (datum: T) => Promise<void>,
) {
  console.log("Populating", tableName);
  await sql`SET client_min_messages = warning`;
  await sql`DROP TABLE IF EXISTS ${sql(tableName)} CASCADE`;
  await sql.unsafe(`
        CREATE TABLE "${tableName}" (
          ${columns
            .map(
              ([columnName, typeAndConstraint]) =>
                `"${String(columnName)}" ${typeAndConstraint}`,
            )
            .join(", ")}
        )
      `);

  // Load items and set up readable CSV stream
  const { data } = Array.isArray(loader) ? { data: loader } : await loader();

  if (transform) {
    for (const datum of data) {
      await transform(datum);
    }
  }

  const csv = stringify(data, {
    header: true,
    columns: columns.map(([columnName]) => columnName as string),
    cast: { boolean: (v) => (v ? "t" : "f") },
  });

  // Set up writeable copy stream to database
  const query = await sql`COPY ${sql(
    tableName,
  )} FROM stdin WITH (HEADER MATCH, FORMAT csv);`.writable();

  // Stream!
  await pipeline(csv, query);
}
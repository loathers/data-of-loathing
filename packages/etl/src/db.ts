import postgres from "postgres";
import { stringify } from "csv-stringify";
import { pipeline } from "stream/promises";

export const sql = postgres(process.env.DATABASE_URL!, {
  onnotice: () => {},
});

const referenceCache = new Map<string, number | null>();

const referenceCacheKey = (
  tableName: string,
  columnName: string,
  name: string,
) => `${tableName}.${columnName}=${name}`;

export async function resolveReference<T extends { id: number }>(
  tableName: string,
  columnName: string,
  name: string | null,
  caseInsensitive = false,
  find?: (row: T) => boolean,
): Promise<number | null> {
  // We cast all results to string here just to keep the type system happy.
  // Since the next step is converting to CSV, this is all handled.

  if (name === null) return null;
  const idPrefix = name.match(/^\[(\d+)]/);
  if (idPrefix) return Number(idPrefix[1]);

  const cacheKey = referenceCacheKey(tableName, columnName, name);
  if (!referenceCache.has(cacheKey)) {
    const results = await sql<T[]>`SELECT * FROM ${sql(
      tableName,
    )} WHERE ${sql(columnName)} ${
      caseInsensitive ? sql`ILIKE` : sql`=`
    } ${name}`;

    if (results.length < 1) {
      console.log(`Could not find ${tableName} with ${columnName} "${name}"`);
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
  loader: (() => Promise<{ data: T[] }>) | T[],
  tableName: string,
  columns: [columnName: keyof T, typeAndConstraints: string][],
  transform?: (datum: T) => Promise<U>,
) {
  await sql`DROP TABLE IF EXISTS ${sql(tableName)} CASCADE`;
  const createQuery = `
  CREATE TABLE "${tableName}" (
    ${columns
      .map(
        ([columnName, typeAndConstraint]) =>
          `"${String(columnName)}" ${typeAndConstraint}`,
      )
      .join(", ")}
  )
  `;
  await sql.unsafe(createQuery);

  // Load items and set up readable CSV stream
  const { data } = Array.isArray(loader) ? { data: loader } : await loader();

  const transformed = transform
    ? (await Promise.all(data.map((d) => transform(d)))).filter(
        (d) => d !== null,
      )
    : data;

  const csv = stringify(transformed, {
    header: true,
    columns: columns.map(([columnName]) => columnName as string),
    cast: {
      boolean: (v) => (v ? "t" : "f"),
      object: (o) => {
        if (Array.isArray(o)) {
          return `{${o
            .map((v) => `"${String(v).replaceAll(/(["'])/g, "\\$1")}"`)
            .join(",")}}`;
        }
        return JSON.stringify(o);
      },
    },
  });

  // Set up writeable copy stream to database
  const query = await sql`COPY ${sql(
    tableName,
  )} FROM stdin WITH (HEADER MATCH, FORMAT csv);`.writable();

  // Stream!
  await pipeline(csv, query);
}

export async function defineEnum<Enum extends { [s: string]: string }>(
  name: string,
  e: Enum,
) {
  await sql.unsafe(`DROP TYPE IF EXISTS "${name}" CASCADE`);
  const createQuery = `CREATE TYPE "${name}" AS ENUM (${Object.values(e)
    .sort()
    .map((v) => `'${v}'`)
    .join(",")})`;
  await sql.unsafe(createQuery);
  return `"${name}"`;
}

export async function initialiseDatabase() {}

export async function markAmbiguous(tableName: string) {
  await sql`
    UPDATE ${sql(tableName)}
      SET "ambiguous" = TRUE
    FROM ( 
      SELECT 
        "name" 
      FROM 
        ${sql(tableName)}
      GROUP BY 
        "name" 
      HAVING 
        COUNT(*) > 1
    ) as "d"
    WHERE ${sql(tableName)}."name" = "d"."name"
  `;
}

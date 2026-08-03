import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { Client } from "./node.js";

let cacheDir: string;

vi.mock("env-paths", () => ({
  default: () => ({ cache: cacheDir }),
}));

let remoteEtag: string | null;
let dbBuffer: ArrayBuffer;
let getCount: number;

beforeEach(async () => {
  cacheDir = await mkdtemp(join(tmpdir(), "dol-test-"));
  remoteEtag = '"etag-1"';
  getCount = 0;

  const dbPath = join(cacheDir, "source.sqlite");
  const db = new DatabaseSync(dbPath);
  db.exec("CREATE TABLE placeholder (id INTEGER PRIMARY KEY)");
  db.close();
  const bytes = await readFile(dbPath);
  dbBuffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  );

  vi.stubGlobal(
    "fetch",
    vi.fn(async (_url: string | URL, init?: RequestInit) => {
      if (init?.method === "HEAD") {
        return new Response(null, {
          headers: remoteEtag === null ? {} : { etag: remoteEtag },
        });
      }
      getCount++;
      return new Response(dbBuffer.slice(0));
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function getOrm(client: Client) {
  return (client as unknown as { _orm: unknown })._orm;
}

test("consecutive loads with unchanged etag reuse the same ORM instance", async () => {
  const client = new Client();
  await client.load();
  const first = getOrm(client);

  await client.load();
  expect(getOrm(client)).toBe(first);
  expect(getCount).toBe(1);
});

test("a changed etag re-initialises the ORM", async () => {
  const client = new Client();
  await client.load();
  const first = getOrm(client);

  remoteEtag = '"etag-2"';
  await client.load();
  expect(getOrm(client)).not.toBe(first);
  expect(getCount).toBe(2);
});

test("force re-initialises even with an unchanged etag", async () => {
  const client = new Client({ force: true });
  await client.load();
  const first = getOrm(client);

  await client.load();
  expect(getOrm(client)).not.toBe(first);
  expect(getCount).toBe(2);
});

test("downloads the database when the server provides no etag", async () => {
  remoteEtag = null;
  const client = new Client();
  await client.load();
  expect(getCount).toBe(1);

  await client.load();
  expect(getCount).toBe(2);
});

test("re-downloads when the cached database is missing despite a matching etag", async () => {
  await new Client().load();
  expect(getCount).toBe(1);

  await rm(join(cacheDir, "dol.sqlite"));

  await new Client().load();
  expect(getCount).toBe(2);
});

import { SqlMikroORM, SqliteDriver } from "@mikro-orm/sql";
import { entities } from "./schema.js";
import { SqliteWorkerDialect } from "./SqliteWorkerDialect.js";
import { BaseClient, DEFAULT_URL, ETAG_KEY } from "./BaseClient.js";

export type Strategy =
  | { strategy?: "memory"; url?: string; force?: boolean }
  | { strategy: "opfs"; url?: string; force?: boolean }
  | { strategy: "ranged"; url?: string };

async function getOpfsEtag(): Promise<string | null> {
  try {
    const root = await navigator.storage.getDirectory();
    const handle = await root.getFileHandle(".dol-etag");
    return (await handle.getFile()).text();
  } catch {
    return null;
  }
}

async function setOpfsEtag(etag: string): Promise<void> {
  const root = await navigator.storage.getDirectory();
  const handle = await root.getFileHandle(".dol-etag", { create: true });
  const writable = await handle.createWritable();
  await writable.write(etag);
  await writable.close();
}

async function writeToOpfs(
  filename: string,
  buffer: ArrayBuffer,
): Promise<void> {
  const root = await navigator.storage.getDirectory();
  const handle = await root.getFileHandle(filename, { create: true });
  const writable = await handle.createWritable();
  await writable.write(buffer);
  await writable.close();
}

export class Client extends BaseClient<Strategy> {
  #dialect?: SqliteWorkerDialect;

  constructor(strategy: Strategy = {}) {
    super(strategy);
  }

  protected async getStoredEtag(_key: string): Promise<string | null> {
    return localStorage.getItem(ETAG_KEY);
  }

  protected async storeEtag(_key: string, etag: string): Promise<void> {
    localStorage.setItem(ETAG_KEY, etag);
  }

  async load(): Promise<void> {
    await this._orm?.close();
    this.#dialect?.createDriver().destroy();

    const strategy = this._strategy;
    const url = this._strategy.url ?? DEFAULT_URL;

    switch (strategy.strategy) {
      case "ranged": {
        this.#dialect = new SqliteWorkerDialect(
          new Worker(new URL("./workers/ranged.js", import.meta.url), {
            type: "module",
          }),
        );
        await this.#dialect.loadRanged(url);
        break;
      }
      case "opfs": {
        this.#dialect = new SqliteWorkerDialect(
          new Worker(new URL("./workers/opfs.js", import.meta.url), {
            type: "module",
          }),
        );
        const { force = false } = strategy;
        const remoteEtag = (await fetch(url, { method: "HEAD" })).headers.get(
          "etag",
        );
        const storedEtag = force ? null : await getOpfsEtag();

        if (force || storedEtag !== remoteEtag) {
          const buffer = await this.fetchDb(url);
          await writeToOpfs("dol.sqlite", buffer);
          if (remoteEtag) await setOpfsEtag(remoteEtag);
        }

        await this.#dialect.loadOpfs("/dol.sqlite");
        break;
      }
      case "memory":
      default: {
        this.#dialect = new SqliteWorkerDialect(
          new Worker(new URL("./workers/memory.js", import.meta.url), {
            type: "module",
          }),
        );
        const { force = false } = strategy;
        const response = await fetch(url, {
          cache: force ? "reload" : "default",
        });
        if (!response.ok)
          throw new Error(`Failed to fetch database: ${response.status}`);
        const buffer = await response.arrayBuffer();
        await this.#dialect.loadMemory(buffer);
      }
    }

    this._orm = await SqlMikroORM.init({
      driver: SqliteDriver,
      driverOptions: this.#dialect,
      dbName: "dol.sqlite",
      entities,
      allowGlobalContext: true,
    });
  }
}

export function createClient(strategy: Strategy = {}): Client {
  return new Client(strategy);
}

export * from "./schema.js";

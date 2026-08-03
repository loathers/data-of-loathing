import { SqlMikroORM, SqliteDriver } from "@mikro-orm/sql";
import { entities } from "./schema.js";
import { SqliteWorkerDialect } from "./SqliteWorkerDialect.js";
import { BaseClient, DEFAULT_URL, ETAG_KEY } from "./BaseClient.js";

export type Strategy =
  | { strategy?: "memory"; url?: string; force?: boolean }
  | { strategy: "opfs"; url?: string; force?: boolean }
  | { strategy: "ranged"; url?: string };

async function readFromOpfs(filename: string): Promise<string | null> {
  try {
    const root = await navigator.storage.getDirectory();
    const handle = await root.getFileHandle(filename);
    return (await handle.getFile()).text();
  } catch {
    return null;
  }
}

async function existsInOpfs(filename: string): Promise<boolean> {
  try {
    const root = await navigator.storage.getDirectory();
    await root.getFileHandle(filename);
    return true;
  } catch {
    return false;
  }
}

async function writeToOpfs(
  filename: string,
  buffer: ArrayBuffer | string,
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

  protected async getStoredEtag(key: string): Promise<string | null> {
    return readFromOpfs(`.${key}`);
  }

  protected async storeEtag(key: string, etag: string): Promise<void> {
    await writeToOpfs(`.${key}`, etag);
  }

  protected async hasCachedDb(): Promise<boolean> {
    return existsInOpfs("dol.sqlite");
  }

  async #teardown(): Promise<void> {
    await this._orm?.close();
    this._orm = undefined;
    this.#dialect?.createDriver().destroy();
    this.#dialect = undefined;
  }

  async load(): Promise<void> {
    const strategy = this._strategy;
    const url = this._strategy.url ?? DEFAULT_URL;

    switch (strategy.strategy) {
      case "ranged": {
        await this.#teardown();
        this.#dialect = new SqliteWorkerDialect(
          new Worker(new URL("./workers/ranged.js", import.meta.url), {
            type: "module",
          }),
        );
        await this.#dialect.loadRanged(url);
        break;
      }
      case "opfs": {
        const { force = false } = strategy;

        const updated = await this.syncIfNeeded(
          url,
          ETAG_KEY,
          async (data) => {
            // the live worker holds an exclusive lock on the OPFS database
            // file, so it must be torn down before the file can be replaced
            await this.#teardown();
            await writeToOpfs("dol.sqlite", data);
          },
          force,
        );

        if (this._orm && !updated) return;

        await this.#teardown();
        this.#dialect = new SqliteWorkerDialect(
          new Worker(new URL("./workers/opfs.js", import.meta.url), {
            type: "module",
          }),
        );
        await this.#dialect.loadOpfs("/dol.sqlite");
        break;
      }
      case "memory":
      default: {
        await this.#teardown();
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

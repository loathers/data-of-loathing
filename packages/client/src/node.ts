import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import envPaths from "env-paths";
import { SqlMikroORM, SqliteDriver, NodeSqliteDialect } from "@mikro-orm/sql";
import { entities } from "./schema.js";
import { BaseClient, DEFAULT_URL } from "./BaseClient.js";

export type Strategy =
  | { strategy?: "url"; url?: string; force?: boolean }
  | { strategy: "local"; path: string };

export class Client extends BaseClient<Strategy> {
  constructor(strategy: Strategy = {}) {
    super(strategy);
  }

  protected async getStoredEtag(key: string): Promise<string | null> {
    try {
      return await readFile(key, "utf-8");
    } catch {
      return null;
    }
  }

  protected async storeEtag(key: string, etag: string): Promise<void> {
    await writeFile(key, etag, "utf-8");
  }

  protected async hasCachedDb(): Promise<boolean> {
    return existsSync(join(this.#cacheDir(), "dol.sqlite"));
  }

  #cacheDirValue?: string;
  #cacheDir(): string {
    return (this.#cacheDirValue ??= envPaths("data-of-loathing").cache);
  }

  private async resolveDbPath(): Promise<{ path: string; updated: boolean }> {
    const strategy = this._strategy;
    switch (strategy.strategy) {
      case "local":
        return { path: strategy.path, updated: false };

      default:
      case "url": {
        const { url = DEFAULT_URL, force = false } = strategy;

        const cacheDir = this.#cacheDir();
        const dbPath = join(cacheDir, "dol.sqlite");
        const etagPath = join(cacheDir, "etag");

        const updated = await this.syncIfNeeded(
          url,
          etagPath,
          async (data) => {
            await mkdir(cacheDir, { recursive: true });
            await writeFile(dbPath, Buffer.from(data));
          },
          force,
        );

        return { path: dbPath, updated };
      }
    }
  }

  async load(): Promise<void> {
    const { path, updated } = await this.resolveDbPath();
    if (this._orm && !updated) return;

    await this._orm?.close();
    this._orm = await SqlMikroORM.init({
      driver: SqliteDriver,
      driverOptions: new NodeSqliteDialect(path),
      dbName: path,
      entities,
      allowGlobalContext: true,
    });
  }
}

export function createClient(strategy: Strategy = {}): Client {
  return new Client(strategy);
}

export * from "./schema.js";

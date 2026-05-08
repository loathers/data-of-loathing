import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
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
    return existsSync(key) ? readFile(key, "utf-8") : null;
  }

  protected async storeEtag(key: string, etag: string): Promise<void> {
    await writeFile(key, etag, "utf-8");
  }

  private async resolveDbPath(): Promise<string> {
    const strategy = this._strategy;
    switch (strategy.strategy) {
      case "local":
        return strategy.path;

      default:
      case "url": {
        const { url = DEFAULT_URL, force = false } = strategy;

        const cacheDir = join(homedir(), ".cache", "data-of-loathing");
        const dbPath = join(cacheDir, "dol.sqlite");
        const etagPath = join(cacheDir, "etag");
        await mkdir(cacheDir, { recursive: true });

        await this.syncIfNeeded(url, etagPath, async (data) => {
          await writeFile(dbPath, Buffer.from(data));
        }, force);

        return dbPath;
      }
    }
  }

  async load(): Promise<void> {
    await this._orm?.close();
    const path = await this.resolveDbPath();
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

import { SqlMikroORM, SqliteDriver } from "@mikro-orm/sql";
import { SQLocalKysely } from "sqlocal/kysely";
import { entities } from "./schema.js";
import { BaseClient, DEFAULT_URL, ETAG_KEY } from "./BaseClient.js";

export type Strategy = { strategy?: "url"; url?: string; force?: boolean };

export class Client extends BaseClient<Strategy> {
  private _db?: SQLocalKysely;

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

    const url = this._strategy.url ?? DEFAULT_URL;

    if (!this._db) {
      this._db = new SQLocalKysely("dol.sqlite");
    }

    await this.syncIfNeeded(url, ETAG_KEY, (data) =>
      this._db!.overwriteDatabaseFile(data), this._strategy.force,
    );

    this._orm = await SqlMikroORM.init({
      driver: SqliteDriver,
      driverOptions: this._db.dialect,
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

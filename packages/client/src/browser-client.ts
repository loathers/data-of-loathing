import { type EntityManager, MikroORM } from "@mikro-orm/core";
import { SqlMikroORM, SqliteDriver } from "@mikro-orm/sql";
import { SQLocalKysely } from "sqlocal/kysely";
import { entities } from "data-of-loathing-schema";

export type Strategy =
  | { strategy?: "cache"; url?: string }
  | { strategy: "remote"; url?: string };

const DEFAULT_URL = "https://data.loathers.net/dol.sqlite";
const ETAG_KEY = "dol-etag";

export class Client {
  private _orm?: MikroORM;
  private _db?: SQLocalKysely;
  private readonly _strategy: Strategy;

  constructor(strategy: Strategy = {}) {
    this._strategy = strategy;
  }

  get em(): EntityManager {
    if (!this._orm) throw new Error("Call await client.load() before querying");
    return this._orm.em;
  }

  async load(): Promise<void> {
    if (this._strategy.strategy === "remote")
      throw new Error("HTTP range request strategy not yet implemented");

    await this._orm?.close();

    const url = this._strategy.url ?? DEFAULT_URL;

    if (!this._db) {
      this._db = new SQLocalKysely("dol.sqlite");
    }

    const storedEtag = localStorage.getItem(ETAG_KEY);
    const head = await fetch(url, { method: "HEAD" });
    const remoteEtag = head.headers.get("etag");

    if (!storedEtag || storedEtag !== remoteEtag) {
      const response = await fetch(url);
      if (!response.ok)
        throw new Error(`Failed to fetch database: ${response.status}`);
      await this._db.overwriteDatabaseFile(await response.arrayBuffer());
      if (remoteEtag) localStorage.setItem(ETAG_KEY, remoteEtag);
    }

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

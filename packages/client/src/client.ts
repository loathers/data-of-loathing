import { MikroORM } from "@mikro-orm/core";
import type { EntityManager } from "@mikro-orm/core";
import { NodeSqliteDialect, SqliteDriver, SqlMikroORM } from "@mikro-orm/sql";
import { entities } from "data-of-loathing-schema";
import { resolveDbPath, type Strategy } from "./strategies.js";

export type { Strategy };

export class Client {
  private _orm?: MikroORM;
  private readonly _strategy: Strategy;

  constructor(strategy: Strategy = {}) {
    this._strategy = strategy;
  }

  get em(): EntityManager {
    if (!this._orm) throw new Error("Call await client.load() before querying");
    return this._orm.em;
  }

  async load(): Promise<void> {
    await this._orm?.close();
    const path = await resolveDbPath(this._strategy);
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

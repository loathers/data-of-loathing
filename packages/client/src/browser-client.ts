import { MikroORM } from "@mikro-orm/core";
import type { EntityManager } from "@mikro-orm/core";
import { SqliteDriver } from "mikro-orm-sqlite-wasm";
import { entities } from "data-of-loathing-schema";
import { resolveDbPath, type BrowserStrategy } from "./browser-strategies.js";

export type { BrowserStrategy as Strategy };

export class Client {
  private _orm?: MikroORM;
  private readonly _strategy: BrowserStrategy;

  constructor(strategy: BrowserStrategy = {}) {
    this._strategy = strategy;
  }

  get em(): EntityManager {
    if (!this._orm) throw new Error("Call await client.load() before querying");
    return this._orm.em;
  }

  async load(): Promise<void> {
    await this._orm?.close();
    const path = await resolveDbPath(this._strategy);
    this._orm = await MikroORM.init({
      driver: SqliteDriver,
      dbName: path,
      entities,
      allowGlobalContext: true,
      driverOptions: { readonly: true },
    });
  }
}

export function createClient(strategy: BrowserStrategy = {}): Client {
  return new Client(strategy);
}

import { MikroORM } from "@mikro-orm/better-sqlite";
import type { EntityManager } from "@mikro-orm/core";
import { entities } from "data-of-loathing-schema";
import { resolveDbPath, type Strategy } from "./strategies.js";

export type { Strategy };

export class Client {
  private _orm?: MikroORM;
  private readonly _strategy: Strategy;

  constructor(strategy: Strategy = {}) {
    this._strategy = strategy;
  }

  /** The MikroORM EntityManager. Use this to query entities with full
   *  populate support, filtering, and the built-in identity map. */
  get em(): EntityManager {
    if (!this._orm) throw new Error("Call await client.load() before querying");
    return this._orm.em;
  }

  /** Download / update the local database copy then (re)initialise the ORM.
   *  For `local` strategy this is a no-op after the first call. */
  async load(): Promise<void> {
    await this._orm?.close();
    const path = await resolveDbPath(this._strategy);
    this._orm = await MikroORM.init({
      dbName: path,
      entities,
      allowGlobalContext: true,
      driverOptions: { readonly: true },
    });
  }
}

export function createClient(strategy: Strategy = {}): Client {
  return new Client(strategy);
}

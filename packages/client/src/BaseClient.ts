import { type EntityManager, MikroORM } from "@mikro-orm/core";

export const DEFAULT_URL = "https://data.loathers.net/dol.sqlite";
export const ETAG_KEY = "dol-etag";

export abstract class BaseClient<S> {
  protected _orm?: MikroORM;
  protected readonly _strategy: S;

  constructor(strategy: S) {
    this._strategy = strategy;
  }

  get query(): EntityManager {
    if (!this._orm) throw new Error("Call await client.load() before querying");
    return this._orm.em;
  }

  abstract load(): Promise<void>;

  protected async fetchDb(url: string): Promise<ArrayBuffer> {
    const response = await fetch(url);
    if (!response.ok)
      throw new Error(`Failed to fetch database: ${response.status}`);
    return response.arrayBuffer();
  }

  protected abstract getStoredEtag(key: string): Promise<string | null>;
  protected abstract storeEtag(key: string, etag: string): Promise<void>;

  protected async syncIfNeeded(
    url: string,
    key: string,
    apply: (data: ArrayBuffer) => Promise<void>,
    force = false,
  ): Promise<void> {
    const storedEtag = force ? null : await this.getStoredEtag(key);
    const head = await fetch(url, { method: "HEAD" });
    const remoteEtag = head.headers.get("etag");

    if (force || storedEtag !== remoteEtag) {
      await apply(await this.fetchDb(url));
      if (remoteEtag) await this.storeEtag(key, remoteEtag);
    }
  }
}

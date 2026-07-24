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
  protected abstract hasCachedDb(): Promise<boolean>;

  /**
   * Download the database unless the cached copy is verifiably fresh, serving
   * the cache when the server is unreachable.
   * @returns whether a new database was downloaded and applied
   */
  protected async syncIfNeeded(
    url: string,
    key: string,
    apply: (data: ArrayBuffer) => Promise<void>,
    force = false,
  ): Promise<boolean> {
    try {
      const [storedEtag, hasCachedDb, head] = await Promise.all([
        force ? null : this.getStoredEtag(key),
        this.hasCachedDb(),
        fetch(url, { method: "HEAD" }),
      ]);
      const remoteEtag = head.headers.get("etag");

      // a missing remote etag means freshness can't be validated, and a
      // stored etag proves nothing if the database itself is gone
      if (force || !remoteEtag || !hasCachedDb || storedEtag !== remoteEtag) {
        await apply(await this.fetchDb(url));
        if (remoteEtag) await this.storeEtag(key, remoteEtag);
        return true;
      }

      return false;
    } catch (e) {
      if (!(await this.hasCachedDb()))
        throw new Error(
          `Failed to fetch database and no cached version exists. ${e}`,
        );
      console.warn(
        "data-of-loathing: could not contact server to check for updates. Serving cached database which may be outdated.",
        e,
      );
      return false;
    }
  }
}

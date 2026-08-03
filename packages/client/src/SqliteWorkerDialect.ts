import { type SqlValue } from "@sqlite.org/sqlite-wasm";
import {
  SqliteAdapter,
  SqliteIntrospector,
  SqliteQueryCompiler,
  type CompiledQuery,
  type DatabaseConnection,
  type DatabaseIntrospector,
  type Dialect,
  type DialectAdapter,
  type Driver,
  type Kysely,
  type QueryCompiler,
  type QueryResult,
} from "kysely";

type WorkerResponse =
  | { id: string; type: "loaded" }
  | { id: string; type: "exec"; rows: Record<string, SqlValue>[] }
  | { id: string; type: "error"; error: string };

export class SqliteWorkerDialect implements Dialect {
  readonly #worker: Worker;
  readonly #pending = new Map<
    string,
    {
      resolve: (value: Record<string, SqlValue>[] | undefined) => void;
      reject: (err: Error) => void;
    }
  >();
  #nextId = 0;

  constructor(worker: Worker) {
    this.#worker = worker;
    this.#worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const pending = this.#pending.get(event.data.id);
      if (!pending) return;
      this.#pending.delete(event.data.id);
      if (event.data.type === "error") {
        pending.reject(new Error(event.data.error));
      } else if (event.data.type === "exec") {
        pending.resolve(event.data.rows);
      } else {
        pending.resolve(undefined);
      }
    };
  }

  #send<T>(message: object, transfer?: Transferable[]): Promise<T> {
    const id = String(++this.#nextId);
    const promise = new Promise<T>((resolve, reject) => {
      this.#pending.set(id, { resolve: (v) => resolve(v as T), reject });
    });
    this.#worker.postMessage({ ...message, id }, transfer ?? []);
    return promise;
  }

  loadMemory(buffer: ArrayBuffer): Promise<void> {
    return this.#send<void>({ type: "load", buffer }, [buffer]);
  }

  loadOpfs(filename: string): Promise<void> {
    return this.#send<void>({ type: "load", filename });
  }

  loadRanged(url: string): Promise<void> {
    return this.#send<void>({ type: "load", url });
  }

  createDriver(): Driver {
    const dialect = this;
    const connection: DatabaseConnection = {
      executeQuery<O>(query: CompiledQuery): Promise<QueryResult<O>> {
        return dialect
          .#send<
            O[]
          >({ type: "exec", sql: query.sql, bind: [...query.parameters] })
          .then((rows) => ({ rows }));
      },
      async *streamQuery() {
        throw new Error("Streaming not supported");
      },
    };
    return {
      async init() {},
      async acquireConnection() {
        return connection;
      },
      async beginTransaction() {},
      async commitTransaction() {},
      async rollbackTransaction() {},
      async releaseConnection() {},
      async destroy() {
        dialect.#worker.terminate();
      },
    };
  }

  createQueryCompiler(): QueryCompiler {
    return new SqliteQueryCompiler();
  }

  createAdapter(): DialectAdapter {
    return new SqliteAdapter();
  }

  createIntrospector(db: Kysely<any>): DatabaseIntrospector {
    return new SqliteIntrospector(db);
  }
}

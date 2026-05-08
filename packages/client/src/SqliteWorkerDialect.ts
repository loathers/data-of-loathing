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
  | { id: string; type: "load-memory" | "load-opfs" }
  | { id: string; type: "exec"; rows: Record<string, unknown>[] }
  | { id: string; type: "error"; error: string };

export class SqliteWorkerDialect implements Dialect {
  readonly #worker: Worker;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly #pending = new Map<string, { resolve: (value: any) => void; reject: (err: Error) => void }>();
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
    return new Promise((resolve, reject) => {
      this.#pending.set(id, { resolve, reject });
      this.#worker.postMessage({ ...message, id }, transfer ?? []);
    });
  }

  loadMemory(buffer: ArrayBuffer): Promise<void> {
    return this.#send<void>({ type: "load-memory", buffer }, [buffer]);
  }

  loadOpfs(filename: string): Promise<void> {
    return this.#send<void>({ type: "load-opfs", filename });
  }

  createDriver(): Driver {
    const dialect = this;
    const connection: DatabaseConnection = {
      executeQuery<O>(query: CompiledQuery): Promise<QueryResult<O>> {
        return dialect
          .#send<O[]>({ type: "exec", sql: query.sql, bind: [...query.parameters] })
          .then((rows) => ({ rows }));
      },
      async *streamQuery() {
        throw new Error("Streaming not supported");
      },
    };
    return {
      async init() {},
      async acquireConnection() { return connection; },
      async beginTransaction() {},
      async commitTransaction() {},
      async rollbackTransaction() {},
      async releaseConnection() {},
      async destroy() { dialect.#worker.terminate(); },
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

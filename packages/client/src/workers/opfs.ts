import sqlite3InitModule, { BindingSpec, Database, Sqlite3Static, SqlValue } from "@sqlite.org/sqlite-wasm";

type WorkerMessage =
  | { type: "load"; id: string; filename: string }
  | { type: "exec"; id: string; sql: string; bind: BindingSpec };

let db: Database;
let sqlite3: Sqlite3Static | undefined;

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { type, id } = event.data;
  try {
    sqlite3 ??= await sqlite3InitModule();

    switch (type) {
      case "load": {
        db = new sqlite3.oo1.OpfsDb(event.data.filename);
        self.postMessage({ id, type: "loaded" });
        break;
      }
      case "exec": {
        const rows: Record<string, SqlValue>[] = [];
        db!.exec({ sql: event.data.sql, bind: event.data.bind, rowMode: "object", resultRows: rows });
        self.postMessage({ id, type: "exec", rows });
        break;
      }
    }
  } catch (e) {
    self.postMessage({ id, type: "error", error: String(e) });
  }
};

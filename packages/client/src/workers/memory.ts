import sqlite3InitModule, {
  BindingSpec,
  Database,
  Sqlite3Static,
  SqlValue,
} from "@sqlite.org/sqlite-wasm";

type WorkerMessage =
  | { type: "load"; id: string; buffer: ArrayBuffer }
  | { type: "exec"; id: string; sql: string; bind: BindingSpec };

let db: Database;
let sqlite3: Sqlite3Static | undefined;

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { type, id } = event.data;
  try {
    // @ts-expect-error - printErr is supported at runtime but not in the type definition
    sqlite3 ??= await sqlite3InitModule({
      printErr: (msg: string) => {
        if (!msg.includes("OPFS")) console.error(msg);
      },
    });

    switch (type) {
      case "load": {
        const { buffer } = event.data;
        const p = sqlite3.wasm.allocFromTypedArray(new Uint8Array(buffer));
        db = new sqlite3.oo1.DB();
        sqlite3.capi.sqlite3_deserialize(
          db.pointer!,
          "main",
          p,
          buffer.byteLength,
          buffer.byteLength,
          sqlite3.capi.SQLITE_DESERIALIZE_FREEONCLOSE |
            sqlite3.capi.SQLITE_DESERIALIZE_READONLY,
        );
        self.postMessage({ id, type: "loaded" });
        break;
      }
      case "exec": {
        const rows: Record<string, SqlValue>[] = [];
        db.exec({
          sql: event.data.sql,
          bind: event.data.bind,
          rowMode: "object",
          resultRows: rows,
        });
        self.postMessage({ id, type: "exec", rows });
        break;
      }
    }
  } catch (e) {
    self.postMessage({ id, type: "error", error: String(e) });
  }
};

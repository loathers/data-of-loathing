import sqlite3InitModule from "@sqlite.org/sqlite-wasm";

type WorkerMessage =
  | { type: "load-memory"; id: string; buffer: ArrayBuffer }
  | { type: "load-opfs"; id: string; filename: string }
  | { type: "exec"; id: string; sql: string; bind: unknown[] };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any;

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { type, id } = event.data;
  try {
    const sqlite3 = await sqlite3InitModule();

    if (type === "load-memory") {
      const { buffer } = event.data;
      const p = sqlite3.wasm.allocFromTypedArray(new Uint8Array(buffer));
      db = new sqlite3.oo1.DB();
      sqlite3.capi.sqlite3_deserialize(
        db.pointer!,
        "main",
        p,
        buffer.byteLength,
        buffer.byteLength,
        sqlite3.capi.SQLITE_DESERIALIZE_FREEONCLOSE | sqlite3.capi.SQLITE_DESERIALIZE_READONLY,
      );
      self.postMessage({ id, type: "load-memory" });
    } else if (type === "load-opfs") {
      db = new sqlite3.oo1.OpfsDb(event.data.filename);
      self.postMessage({ id, type: "load-opfs" });
    } else if (type === "exec") {
      const rows: Record<string, unknown>[] = [];
      db!.exec({ sql: event.data.sql, bind: event.data.bind, rowMode: "object", resultRows: rows });
      self.postMessage({ id, type: "exec", rows });
    }
  } catch (e) {
    self.postMessage({ id, type: "error", error: String(e) });
  }
};

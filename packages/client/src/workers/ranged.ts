import sqlite3InitModule, {
  BindingSpec,
  CAPI,
  Database,
  Sqlite3Result,
  SqlValue,
  type Sqlite3Static,
  type SQLiteStruct,
} from "@sqlite.org/sqlite-wasm";

type WorkerMessage =
  | { type: "load"; id: string; url: string }
  | { type: "exec"; id: string; sql: string; bind: BindingSpec };

let db: Database;
let sqlite3: Sqlite3Static | undefined;

const fileUrls = new Map<number, string>();
const fileSizes = new Map<number, number>();
const readCache = new Map<number, Map<string, Uint8Array>>();
let vfsInstalled = false;

function syncFetchRange(
  url: string,
  start: number,
  end: number,
): { data: Uint8Array; totalSize: number | null } | null {
  try {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url, false);
    xhr.responseType = "arraybuffer";
    xhr.setRequestHeader("Range", `bytes=${start}-${end}`);
    xhr.send();
    if (xhr.status !== 200 && xhr.status !== 206) return null;
    const data = new Uint8Array(xhr.response);

    let totalSize: number | null = null;
    const contentRange = xhr.getResponseHeader("Content-Range");
    if (contentRange) {
      const match = /\/(\d+)$/.exec(contentRange);
      if (match) totalSize = parseInt(match[1], 10);
    }
    if (totalSize === null) {
      const cl = xhr.getResponseHeader("Content-Length");
      if (cl) totalSize = parseInt(cl, 10);
    }

    return { data, totalSize };
  } catch {
    return null;
  }
}

function structSizeof(capi: CAPI): number {
  const tmp = new capi.sqlite3_file();
  const size = tmp.structInfo.sizeof;
  tmp.dispose();
  return size;
}

function installRangedVfs(s3: Sqlite3Static): void {
  if (vfsInstalled) return;
  vfsInstalled = true;

  const { capi, wasm } = s3;

  const ioMethods = new capi.sqlite3_io_methods();
  ioMethods.iVersion = 1;

  const vfsStruct = new capi.sqlite3_vfs();
  vfsStruct.$iVersion = 1;
  vfsStruct.$szOsFile = structSizeof(capi);
  vfsStruct.$mxPathname = 2048;

  s3.vfs.installVfs({
    io: {
      struct: ioMethods,
      methods: {
        xClose(pFile: number) {
          fileUrls.delete(pFile);
          fileSizes.delete(pFile);
          readCache.delete(pFile);
          return capi.SQLITE_OK;
        },
        xRead(pFile: number, pBuf: number, iAmt: number, iOfst: number) {
          const url = fileUrls.get(pFile);
          if (!url) return capi.SQLITE_IOERR_READ;

          // iOfst is BigInt at runtime in WASM_BIGINT builds despite the number type
          const offset = Number(iOfst);
          const cacheKey = `${offset}:${iAmt}`;
          const cache = readCache.get(pFile);
          const cached = cache?.get(cacheKey);
          if (cached) {
            wasm.heap8u().set(cached, pBuf);
            return capi.SQLITE_OK;
          }

          const result = syncFetchRange(url, offset, offset + iAmt - 1);
          if (!result) return capi.SQLITE_IOERR_READ;

          cache?.set(cacheKey, result.data);

          const heap = wasm.heap8u();
          const toCopy = Math.min(result.data.length, iAmt);
          heap.set(result.data.subarray(0, toCopy), pBuf);
          if (toCopy < iAmt) {
            heap.fill(0, pBuf + toCopy, pBuf + iAmt);
            return capi.SQLITE_IOERR_SHORT_READ;
          }
          return capi.SQLITE_OK;
        },
        xWrite() {
          return capi.SQLITE_READONLY;
        },
        xTruncate() {
          return capi.SQLITE_READONLY;
        },
        xSync() {
          return capi.SQLITE_OK;
        },
        xFileSize(pFile: number, pSize: number) {
          const url = fileUrls.get(pFile);
          if (!url) return capi.SQLITE_IOERR;
          let size = fileSizes.get(pFile);
          if (size === undefined) {
            const result = syncFetchRange(url, 0, 0);
            size = result?.totalSize ?? 0;
            fileSizes.set(pFile, size);
          }
          // Write i64 as two i32s (little-endian); poke("i64") requires BigInt in WASM_BIGINT mode
          wasm.poke(pSize, size >>> 0, "i32");
          wasm.poke(pSize + 4, Math.floor(size / 0x100000000), "i32");
          return capi.SQLITE_OK;
        },
        xLock() {
          return capi.SQLITE_OK;
        },
        xUnlock() {
          return capi.SQLITE_OK;
        },
        xCheckReservedLock(_pFile: number, pResOut: number) {
          wasm.poke(pResOut, 0, "i32");
          return capi.SQLITE_OK;
        },
        xFileControl() {
          return capi.SQLITE_NOTFOUND;
        },
        xSectorSize() {
          return 512 as Sqlite3Result;
        },
        xDeviceCharacteristics() {
          return capi.SQLITE_IOCAP_IMMUTABLE as Sqlite3Result;
        },
      },
    },
    vfs: {
      struct: vfsStruct,
      methods: {
        xOpen(
          _pVfs: number,
          zName: number,
          pFile: number,
          _flags: number,
          pOutFlags: number,
        ) {
          const url = zName ? (wasm.cstrToJs(zName) ?? "") : "";
          const fileObj = new capi.sqlite3_file(pFile);
          fileObj.$pMethods = ioMethods.pointer;
          fileUrls.set(pFile, url);
          const cache = new Map<string, Uint8Array>();
          readCache.set(pFile, cache);

          // Pre-fetch first 64KB to warm cache with header + early B-tree pages
          const prefetch = syncFetchRange(url, 0, 65535);
          if (prefetch) {
            if (prefetch.totalSize != null)
              fileSizes.set(pFile, prefetch.totalSize);
            // Detect page size from SQLite header bytes 16-17 (big-endian); value of 1 means 65536
            const rawPgSize =
              prefetch.data.length >= 18
                ? (prefetch.data[16] << 8) | prefetch.data[17]
                : 0;
            const pageSize = rawPgSize === 1 ? 65536 : rawPgSize || 4096;
            for (
              let offset = 0;
              offset + pageSize <= prefetch.data.length;
              offset += pageSize
            ) {
              cache.set(
                `${offset}:${pageSize}`,
                prefetch.data.slice(offset, offset + pageSize),
              );
            }
          }

          if (pOutFlags) wasm.poke(pOutFlags, capi.SQLITE_OPEN_READONLY, "i32");
          return capi.SQLITE_OK;
        },
        xDelete() {
          return capi.SQLITE_IOERR_DELETE;
        },
        xAccess(
          _pVfs: number,
          _zName: number,
          _flags: number,
          pResOut: number,
        ) {
          wasm.poke(pResOut, 1, "i32");
          return capi.SQLITE_OK;
        },
        xFullPathname(
          _pVfs: number,
          zName: number,
          nOut: number,
          zOut: number,
        ) {
          const name = wasm.cstrToJs(zName) ?? "";
          const bytes = new TextEncoder().encode(name + "\0");
          if (bytes.length > nOut) return capi.SQLITE_CANTOPEN;
          wasm.heap8u().set(bytes, zOut);
          return capi.SQLITE_OK;
        },
        xRandomness(_pVfs: number, nByte: number, zOut: number) {
          const buf = new Uint8Array(nByte);
          crypto.getRandomValues(buf);
          wasm.heap8u().set(buf, zOut);
          return nByte as Sqlite3Result;
        },
        xSleep() {
          return capi.SQLITE_OK;
        },
        xCurrentTime(_pVfs: number, pTimeOut: number) {
          wasm.poke(pTimeOut, Date.now() / 86400000 + 2440587.5, "f64");
          return capi.SQLITE_OK;
        },
        xGetLastError(_pVfs: number, nBuf: number, zBuf: number) {
          if (nBuf > 0) wasm.poke(zBuf, 0, "i8");
          return 0;
        },
      },
      name: "ranged",
      asDefault: false,
    },
  });
}

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
        installRangedVfs(sqlite3);
        db = new sqlite3.oo1.DB(event.data.url, "r", "ranged");
        self.postMessage({ id, type: "loaded" });
        break;
      }
      case "exec": {
        const rows: Record<string, SqlValue>[] = [];
        db!.exec({
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

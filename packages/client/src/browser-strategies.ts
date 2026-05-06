export const DEFAULT_URL = "https://data.loathers.net/data-of-loathing.sqlite";

export type BrowserStrategy =
  | { strategy?: "cache"; url?: string }
  | { strategy: "remote"; url?: string };

const OPFS_FILENAME = "data-of-loathing.sqlite";
const ETAG_KEY = "data-of-loathing-etag";

async function writeToOpfs(data: ArrayBuffer): Promise<void> {
  const root = await navigator.storage.getDirectory();
  const handle = await root.getFileHandle(OPFS_FILENAME, { create: true });
  const writable = await handle.createWritable();
  await writable.write(data);
  await writable.close();
}

async function opfsFileExists(): Promise<boolean> {
  try {
    const root = await navigator.storage.getDirectory();
    await root.getFileHandle(OPFS_FILENAME);
    return true;
  } catch {
    return false;
  }
}

export async function resolveDbPath(opts: BrowserStrategy): Promise<string> {
  if (opts.strategy === "remote")
    throw new Error("HTTP range request strategy not yet implemented");

  const url = opts.url ?? DEFAULT_URL;
  const storedEtag = localStorage.getItem(ETAG_KEY);

  const head = await fetch(url, { method: "HEAD" });
  const remoteEtag = head.headers.get("etag");

  if (!(await opfsFileExists()) || storedEtag !== remoteEtag) {
    const response = await fetch(url);
    if (!response.ok)
      throw new Error(`Failed to fetch database: ${response.status}`);
    await writeToOpfs(await response.arrayBuffer());
    if (remoteEtag) localStorage.setItem(ETAG_KEY, remoteEtag);
  }

  return OPFS_FILENAME;
}

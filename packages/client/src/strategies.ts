import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";

export const DEFAULT_URL =
  "https://data.loathers.net/data-of-loathing.sqlite";

export type Strategy =
  | { strategy?: "cache"; url?: string }
  | { strategy: "download"; url?: string }
  | { strategy: "local"; path: string }
  | { strategy: "remote"; url?: string };

async function fetchDb(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok)
    throw new Error(`Failed to fetch database: ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

export async function resolveDbPath(opts: Strategy): Promise<string> {
  const strategy = opts.strategy ?? "cache";

  switch (strategy) {
    case "local":
      return (opts as { path: string }).path;

    case "download": {
      const url = (opts as { url?: string }).url ?? DEFAULT_URL;
      const buffer = await fetchDb(url);
      const path = join(tmpdir(), `data-of-loathing-${Date.now()}.sqlite`);
      await writeFile(path, buffer);
      return path;
    }

    case "cache": {
      const url = (opts as { url?: string }).url ?? DEFAULT_URL;
      const cacheDir = join(homedir(), ".cache", "data-of-loathing");
      const dbPath = join(cacheDir, "data-of-loathing.sqlite");
      const etagPath = join(cacheDir, "etag");

      await mkdir(cacheDir, { recursive: true });

      const storedEtag = existsSync(etagPath)
        ? await readFile(etagPath, "utf-8")
        : null;

      const head = await fetch(url, { method: "HEAD" });
      const remoteEtag = head.headers.get("etag");

      if (!existsSync(dbPath) || storedEtag !== remoteEtag) {
        const buffer = await fetchDb(url);
        await writeFile(dbPath, buffer);
        if (remoteEtag) await writeFile(etagPath, remoteEtag, "utf-8");
      }

      return dbPath;
    }

    case "remote":
      throw new Error("HTTP range request strategy not yet implemented");
  }
}

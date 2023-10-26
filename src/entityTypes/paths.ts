import { populateEntity } from "../db";
import { loadMafiaEnum } from "../utils";

export type PathType = {
  id: number;
  name: string;
  image: string;
  isAvatar: boolean;
  article: string | null;
  pointsPreference: string | null;
  maximumPoints: number;
  bucket: boolean;
  stomachCapacity: number;
  liverCapacity: number;
  spleenCapacity: number;
  enumName: string;
};

const defaultPath: Omit<
  PathType,
  "name" | "id" | "isAvatar" | "image" | "article" | "enumName"
> = {
  pointsPreference: null,
  maximumPoints: 0,
  bucket: false,
  stomachCapacity: 15,
  liverCapacity: 14,
  spleenCapacity: 15,
};

export async function loadPaths(): Promise<{ size: number; data: PathType[] }>;
export async function loadPaths(
  lastKnownSize: number,
): Promise<{ size: number; data: PathType[] } | null>;
export async function loadPaths(lastKnownSize = 0) {
  const raw = await loadMafiaEnum(
    "net.sourceforge.kolmafia.AscensionPath",
    lastKnownSize,
    "Path",
  );

  if (raw === null) return null;

  return {
    ...raw,
    data: raw.data.map((p) => ({ ...defaultPath, ...p }) as PathType),
  };
}

export async function populatePaths() {
  return populateEntity(loadPaths, "paths", [
    ["id", "INTEGER PRIMARY KEY"],
    ["name", "TEXT NOT NULL"],
    ["enumName", "TEXT NOT NULL"],
    ["image", "TEXT UNIQUE"],
    ["isAvatar", "BOOLEAN NOT NULL"],
    ["article", "TEXT"],
    ["pointsPreference", "TEXT"],
    ["maximumPoints", "INTEGER NOT NULL"],
    ["bucket", "BOOLEAN NOT NULL"],
    ["stomachCapacity", "INTEGER NOT NULL"],
    ["liverCapacity", "INTEGER NOT NULL"],
    ["spleenCapacity", "INTEGER NOT NULL"],
  ]);
}
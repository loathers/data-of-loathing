import { populateEntity } from "../db.js";
import { loadMafiaEnum } from "../utils.js";

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

export async function loadPaths() {
  const raw = await loadMafiaEnum(
    "net.sourceforge.kolmafia.AscensionPath",
    "Path",
  );

  return raw.map((p) => ({ ...defaultPath, ...p }) as PathType);
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

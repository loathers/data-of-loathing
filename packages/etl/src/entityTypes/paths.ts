import { Path } from "data-of-loathing";
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
  return populateEntity(loadPaths, Path);
}

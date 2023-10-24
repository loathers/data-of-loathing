import { loadMafiaEnum } from "../utils";

export type PathType = {
  name: string;
  id: number;
  isAvatar: boolean;
  image: string;
  article: string | null;
  pointsPreference: string | null;
  maximumPoints: number;
  bucket: boolean;
  stomachCapacity: number | null;
  liverCapacity: number | null;
  spleenCapacity: number | null;
};

const defaultPath: Omit<
  PathType,
  "name" | "id" | "isAvatar" | "image" | "article"
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

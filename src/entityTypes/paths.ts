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

export const loadPaths = async () => {
  const raw = await loadMafiaEnum(
    "net.sourceforge.kolmafia.AscensionPath",
    "Path",
  );

  return raw.map((p) => ({ ...defaultPath, ...p }) as PathType);
};

import { loadMafiaEnum } from "../utils";

export type ClassType = {
  name: string;
  id: number;
  image: string | null;
  primeStatIndex: number;
  path: string | null;
  stun: string | null;
  stomachCapacity: number | null;
  liverCapacity: number | null;
  spleenCapacity: number | null;
};

const defaultClass: Omit<ClassType, "name" | "id"> = {
  image: null,
  primeStatIndex: -1,
  path: null,
  stun: null,
  stomachCapacity: null,
  liverCapacity: null,
  spleenCapacity: null,
};

export async function loadClasses(): Promise<{
  size: number;
  data: ClassType[];
}>;
export async function loadClasses(
  lastKnownSize: number,
): Promise<{ size: number; data: ClassType[] } | null>;
export async function loadClasses(lastKnownSize = 0) {
  const raw = await loadMafiaEnum(
    "net.sourceforge.kolmafia.AscensionClass",
    lastKnownSize,
  );

  if (raw === null) return null;

  return {
    ...raw,
    data: raw.data.map((c) => ({ ...defaultClass, ...c }) as ClassType),
  };
}

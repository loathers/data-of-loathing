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

export const loadClasses = async () => {
  const raw = await loadMafiaEnum("net.sourceforge.kolmafia.AscensionClass");

  return raw.map((c) => ({ ...defaultClass, ...c }) as ClassType);
};

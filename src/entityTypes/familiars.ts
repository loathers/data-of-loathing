import { isMemberOfEnum, loadMafiaData } from "../utils";

export enum FamiliarCategory {
  Stat0 = "stat0", // vollyball-like
  Stat1 = "stat1", // sombrero-like
  Item0 = "item0", // Item Drop
  Item1 = "item1", // Food Drop
  Item2 = "item2", // Booze Drop
  Item3 = "item3", // Candy Drop
  Meat0 = "meat0", // Meat Drop
  Combat0 = "combat0", // Physical Attack
  Combat1 = "combat1", // Elemental Attack
  Drop = "drop", // special drop
  Block = "block", // potato-like
  Delevel = "delevel", // barrrnacle-like
  Hp0 = "hp0", // restore hp during combat
  Mp0 = "mp0", // restore mp during combat
  Meat1 = "meat1", // drops meat during combat
  Stat2 = "stat2", // grants stats during combat
  Other0 = "other0", // does other things during combat
  Hp1 = "hp1", // restore hp after combat
  Mp1 = "mp1", // restore mp after combat
  Stat3 = "stat3", // grants stats after combat
  Other1 = "other1", // does other things after combat
  Passive = "passive", // passive effect
  Underwater = "underwater", // breaths underwater
  Variable = "variable", // varies according to equipment or other factors.
}

const isValidCategory = isMemberOfEnum(FamiliarCategory);

export type FamiliarType = {
  id: number;
  name: string;
  image: string;
  categories: FamiliarCategory[];
  larva: string;
  equipment: string | null;
  arenaStats: {
    cageMatch: number;
    scavengerHunt: number;
    obstacleCourse: number;
    hideAndSeek: number;
  };
  attributes: string[];
};

export const isFamiliarOwnable = ({ id }: { id: number }) => {
  // April Fools familiars
  if (id >= 125 && id < 134) return false;
  // Pokefams
  if (id >= 215 && id < 260) return false;
  return true;
};

const parseFamiliar = (parts: string[]): FamiliarType => ({
  id: Number(parts[0]),
  name: parts[1],
  image: parts[2],
  categories: parts[3]
    .split(",")
    .map((p) => p.trim())
    .filter(isValidCategory),
  larva: parts[4],
  equipment: parts[5] || null,
  arenaStats: {
    cageMatch: Number(parts[6]),
    scavengerHunt: Number(parts[7]),
    obstacleCourse: Number(parts[8]),
    hideAndSeek: Number(parts[9]),
  },
  attributes: parts[10]?.split(",") ?? [],
});

export async function loadFamiliars(): Promise<{
  size: number;
  data: FamiliarType[];
}>;
export async function loadFamiliars(
  lastKnownSize: number,
): Promise<{ size: number; data: FamiliarType[] } | null>;
export async function loadFamiliars(lastKnownSize = 0) {
  const raw = await loadMafiaData("familiars", lastKnownSize);

  if (raw === null) return null;

  return {
    ...raw,
    data: raw.data.filter((p) => p.length > 2).map(parseFamiliar),
  };
}

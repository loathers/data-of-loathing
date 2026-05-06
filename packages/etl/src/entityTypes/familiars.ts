import { Familiar } from "data-of-loathing-schema";
import { populateEntity, resolveReference } from "../db.js";
import { checkVersion, isMemberOfEnum, loadMafiaData } from "../utils.js";

const VERSION = 4;
const FILENAME = "familiars";

export enum FamiliarCategory {
  Stat0 = "stat0",
  Stat1 = "stat1",
  Item0 = "item0",
  Item1 = "item1",
  Item2 = "item2",
  Item3 = "item3",
  Meat0 = "meat0",
  Combat0 = "combat0",
  Combat1 = "combat1",
  Drop = "drop",
  Block = "block",
  Delevel0 = "delevel0",
  Delevel1 = "delevel1",
  Hp0 = "hp0",
  Mp0 = "mp0",
  Meat1 = "meat1",
  Stat2 = "stat2",
  Other0 = "other0",
  Hp1 = "hp1",
  Mp1 = "mp1",
  Stat3 = "stat3",
  Other1 = "other1",
  Passive = "passive",
  Underwater = "underwater",
  Pokefam = "pokefam",
  Variable = "variable",
}

const isValidCategory = isMemberOfEnum(FamiliarCategory);

export type FamiliarType = {
  id: number;
  name: string;
  image: string;
  categories: FamiliarCategory[];
  larva: string | null;
  equipment: string | null;
  cageMatch: number;
  scavengerHunt: number;
  obstacleCourse: number;
  hideAndSeek: number;
  attributes: string[];
};

export const isFamiliarOwnable = ({ id }: { id: number }) => {
  if (id >= 125 && id < 134) return false;
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
  larva: parts[4] || null,
  equipment: parts[5] || null,
  cageMatch: Number(parts[6]),
  scavengerHunt: Number(parts[7]),
  obstacleCourse: Number(parts[8]),
  hideAndSeek: Number(parts[9]),
  attributes: parts[10]?.split(",") ?? [],
});

export async function checkFamiliarsVersion() {
  return await checkVersion("Familiars", FILENAME, VERSION);
}

export async function loadFamiliars() {
  const raw = await loadMafiaData(FILENAME);
  return raw.filter((p) => p.length > 2).map(parseFamiliar);
}

export async function populateFamiliars() {
  return populateEntity(
    loadFamiliars,
    Familiar,
    async (familiar) => ({
      ...familiar,
      larva: await resolveReference(
        "familiar larva",
        "items",
        "name",
        familiar.larva,
      ),
      equipment: await resolveReference(
        "familiar equipment",
        "items",
        "name",
        familiar.equipment,
      ),
    }),
  );
}

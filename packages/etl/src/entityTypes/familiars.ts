import { defineEnum, populateEntity, resolveReference } from "../db.js";
import { checkVersion, isMemberOfEnum, loadMafiaData } from "../utils.js";

const VERSION = 1;
const FILENAME = "familiars";

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
  Delevel0 = "delevel0", // barrrnacle-like, delevels at start of combat
  Delevel1 = "delevel1", // ghost pickle-like, delevels during combat
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
  Pokefam = "pokefam", // is a pokefam-only familiar
  Variable = "variable", // varies according to equipment or other factors.
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
  const category = await defineEnum("FamiliarCategory", FamiliarCategory);
  return populateEntity(
    loadFamiliars,
    "familiars",
    [
      ["id", "INTEGER PRIMARY KEY"],
      ["name", "TEXT NOT NULL"],
      ["image", "TEXT NOT NULL"],
      ["categories", `${category}[] NOT NULL`],
      ["larva", "INTEGER REFERENCES items(id)"],
      ["equipment", "INTEGER REFERENCES items(id)"],
      ["cageMatch", "INTEGER NOT NULL"],
      ["scavengerHunt", "INTEGER NOT NULL"],
      ["obstacleCourse", "INTEGER NOT NULL"],
      ["hideAndSeek", "INTEGER NOT NULL"],
      ["attributes", "TEXT[] NOT NULL"],
    ],
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

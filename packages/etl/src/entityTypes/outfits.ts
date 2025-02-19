import { populateEntity, resolveReference } from "../db.js";
import { checkVersion, loadMafiaData } from "../utils.js";

const VERSION = 3;
const FILENAME = "outfits";

const parseEquipment = (equipmentList = "") => equipmentList.trim().split(", ");

export type OutfitTreat = {
  item: string;
  chance: number;
};

const parseTreats = (treatList = ""): OutfitTreat[] =>
  treatList
    .trim()
    .split(", ")
    .filter((t) => t !== "none")
    .map((treat) => {
      const m = treat.match(/^(.*?) \((\d*\.?\d+)\)$/);
      if (!m) return { item: treat, chance: 1 };
      return { item: m[1], chance: Number(m[2]) };
    });

export type OutfitType = {
  id: number;
  name: string;
  image: string;
  equipment: string[];
  treats: OutfitTreat[];
};

const parseOutfit = (parts: string[]): OutfitType => ({
  id: Number(parts[0]),
  name: parts[1],
  image: parts[2],
  equipment: parseEquipment(parts[3] ?? ""),
  treats: parseTreats(parts[0] === "80" ? "double-ice gum" : (parts[4] ?? "")),
});

export async function checkOutfitsVersion() {
  return await checkVersion("Outfits", FILENAME, VERSION);
}

export async function loadOutfits(): Promise<{
  size: number;
  data: OutfitType[];
}>;
export async function loadOutfits(
  lastKnownSize: number,
): Promise<{ size: number; data: OutfitType[] } | null>;
export async function loadOutfits(lastKnownSize = 0) {
  const raw = await loadMafiaData(FILENAME, lastKnownSize);

  if (raw === null) return null;

  return {
    ...raw,
    data: raw.data.filter((p) => p.length > 2).map(parseOutfit),
  };
}

export async function populateOutfits() {
  const outfits = await loadOutfits();

  await populateEntity(outfits.data, "outfits", [
    ["id", "INTEGER PRIMARY KEY"],
    ["name", "TEXT NOT NULL"],
    ["image", "TEXT NOT NULL"],
  ]);

  const outfitEquipment = outfits.data.flatMap((o) =>
    o.equipment.map((e) => ({ outfit: o.id, equipment: e })),
  );

  const outfitTreats = outfits.data.flatMap((o) =>
    o.treats.map((t) => ({ outfit: o.id, ...t })),
  );

  await Promise.all([
    populateEntity(
      outfitEquipment,
      "outfitEquipment",
      [
        ["outfit", "INTEGER NOT NULL REFERENCES outfits(id)"],
        ["equipment", "INTEGER NOT NULL REFERENCES items(id)"],
      ],
      async (equip) => ({
        ...equip,
        equipment: await resolveReference("items", "name", equip.equipment),
      }),
    ),
    populateEntity(
      outfitTreats,
      "outfitTreats",
      [
        ["outfit", "INTEGER REFERENCES outfits(id)"],
        ["item", "INTEGER REFERENCES items(id)"],
        ["chance", "REAL NOT NULL"],
      ],
      async (treat) => ({
        ...treat,
        item: await resolveReference("items", "name", treat.item),
      }),
    ),
  ]);
}

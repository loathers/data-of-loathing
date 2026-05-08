import { Outfit, OutfitTreat } from "data-of-loathing";
import { populateEntity, populatePivot, resolveReference } from "../db.js";
import { checkVersion, loadMafiaData } from "../utils.js";

const VERSION = 3;
const FILENAME = "outfits";

const parseEquipment = (equipmentList = "") => equipmentList.trim().split(", ");

export type OutfitTreatType = {
  item: string;
  chance: number;
};

const parseTreats = (treatList = ""): OutfitTreatType[] =>
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
  treats: OutfitTreatType[];
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

export async function loadOutfits() {
  const raw = await loadMafiaData(FILENAME);
  return raw.filter((p) => p.length > 2).map(parseOutfit);
}

export async function populateOutfits() {
  const outfits = await loadOutfits();

  await populateEntity(
    outfits.map(({ equipment: _, treats: __, ...o }) => o),
    Outfit,
  );

  const equipmentRows: { outfit: number; equipment: number | null }[] = [];
  for (const o of outfits) {
    for (const name of o.equipment) {
      const itemId = await resolveReference(
        "outfitEquipment",
        "items",
        "name",
        name,
      );
      equipmentRows.push({ outfit: o.id, equipment: itemId });
    }
  }

  await populatePivot(
    "outfitEquipment",
    ["outfit", "equipment"],
    equipmentRows.filter((r) => r.equipment !== null),
  );

  await populateEntity(
    outfits.flatMap((o) =>
      o.treats.map((t) => ({ outfit: o.id, ...t })).filter((t) => t.item !== ""),
    ),
    OutfitTreat,
    async (treat) => ({
      outfit: treat.outfit,
      item: await resolveReference("outfitTreats", "items", "name", treat.item),
      chance: treat.chance,
    }),
  );
}

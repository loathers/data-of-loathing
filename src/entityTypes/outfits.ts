import { loadMafiaData } from "../utils";

export type Treat = {
  item: string;
  chance: number;
};

const parseEquipment = (equipmentList = "") =>
  equipmentList.trim().split(", ");

const parseTreats = (treatList = "") =>
  treatList
    .trim()
    .split(", ")
    .filter((t) => t !== "none")
    .map((treat) => {
      const m = treat.match(/^(.*?) \((\d*\.?\d+)\)$/);
      if (!m) return { item: treat, chance: 1 };
      return { item: m[1], chance: Number(m[2]) };
    });

export type Outfit = {
  id: number;
  name: string;
  image: string;
  equipment: string[];
  treats: Treat[];
};

const parseOutfit = (parts: string[]): Outfit => ({
  id: Number(parts[0]),
  name: parts[1],
  image: parts[2],
  equipment: parseEquipment(parts[3] ?? ""),
  treats: parseTreats(parts[0] === "80" ? "double-ice gum" : parts[4] ?? ""),
});

export const loadOutfits = async (lastKnownSize?: number) => {
  const raw = await loadMafiaData("outfits", lastKnownSize);

  if (raw === null) return null;

  return {
    ...raw,
    data: raw.data.filter((p) => p.length > 2).map(parseOutfit),
  };
};
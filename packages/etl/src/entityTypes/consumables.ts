import { Consumable } from "data-of-loathing-schema";
import { populateEntity, resolveReference } from "../db.js";
import {
  checkVersion,
  getAverage,
  loadMafiaData,
  memberOfEnumElse,
} from "../utils.js";

export enum ConsumableQuality {
  None = "none",
  Crappy = "crappy",
  Decent = "decent",
  Good = "good",
  Awesome = "awesome",
  EPIC = "EPIC",
  SuperEPIC = "super_EPIC",
  SuperUltraEPIC = "super_ultra_EPIC",
  SuperUltraMegaEPIC = "super_ultra_mega_EPIC",
  SuperUltraMegaTurboEPIC = "super_ultra_mega_turbo_EPIC",
  Quest = "quest",
  Changing = "changing",
  Drippy = "drippy",
}

const validQuality = memberOfEnumElse(
  ConsumableQuality,
  ConsumableQuality.None,
);

const transformedQuality = (quality: string) => {
  if (quality === "???") return ConsumableQuality.Changing;
  return validQuality(quality.replaceAll(" ", "_"));
};

export type ConsumableRow = {
  id: string;
  stomach: number;
  liver: number;
  spleen: number;
  levelRequirement: number;
  quality: ConsumableQuality;
  adventureRange: string;
  adventures: number;
  muscle: number;
  muscleRange: string;
  mysticality: number;
  mysticalityRange: string;
  moxie: number;
  moxieRange: string;
  notes: string;
};

const parseConsumable = (
  type: string,
  parts: string[],
): ConsumableRow | null => {
  if (parts[3] === "pseudoitem") return null;

  return {
    id: parts[0],
    stomach: type === "fullness" ? Number(parts[1]) : 0,
    liver: type === "inebriety" ? Number(parts[1]) : 0,
    spleen: type === "spleenhit" ? Number(parts[1]) : 0,
    levelRequirement: Number(parts[2]),
    quality: transformedQuality(parts[3]),
    adventureRange: parts[4],
    adventures: getAverage(parts[4]),
    muscle: getAverage(parts[5]),
    muscleRange: parts[5],
    mysticality: getAverage(parts[6]),
    mysticalityRange: parts[6],
    moxie: getAverage(parts[7]),
    moxieRange: parts[7],
    notes: parts[8],
  };
};

const CONSUMABLES_FILES = [
  ["Food", "fullness", 2],
  ["Booze", "inebriety", 2],
  ["Spleen Items", "spleenhit", 3],
] as const;

const CAFE_FILES = [
  ["Cafe Food", "cafe_food", 1],
  ["Cafe Booze", "cafe_booze", 1],
] as const;

export async function checkConsumablesVersion() {
  return (
    await Promise.all(
      [...CONSUMABLES_FILES, ...CAFE_FILES].map(([name, file, version]) =>
        checkVersion(name, file, version),
      ),
    )
  ).every(Boolean);
}

export async function loadConsumables() {
  const fakeItems = (
    await Promise.all(CAFE_FILES.map((c) => loadMafiaData(c[1])))
  )
    .filter((i) => i !== null)
    .flat()
    .map((i) => i[1]);

  const data = (
    await Promise.all(
      CONSUMABLES_FILES.map(
        async ([, file]) => [file, await loadMafiaData(file)] as const,
      ),
    )
  )
    .filter(([, d]) => d !== null)
    .flatMap(
      ([type, d]) =>
        d
          ?.filter((p) => p.length > 7)
          .filter((p) => !fakeItems.includes(p[0]))
          .map((d) => parseConsumable(type, d))
          .filter((d) => d !== null) ?? [],
    );

  const combined = data.reduce<Record<string, ConsumableRow>>((acc, c) => {
    if (acc[c.id]) {
      acc[c.id].stomach += c.stomach;
      acc[c.id].liver += c.liver;
      acc[c.id].spleen += c.spleen;
    } else {
      acc[c.id] = c;
    }
    return acc;
  }, {});

  return [...Object.values(combined)];
}

export async function populateConsumables() {
  const consumables = await loadConsumables();
  await populateEntity(
    consumables,
    Consumable,
    async (consumable) => {
      const itemId = await resolveReference(
        "consumables",
        "items",
        "name",
        consumable.id,
      );
      if (!itemId) return null;
      const { id: _, ...rest } = consumable;
      return { ...rest, item: itemId };
    },
  );
}

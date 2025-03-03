import { defineEnum, populateEntity, resolveReference } from "../db.js";
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

export type Consumable = {
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

const parseConsumable = (type: string, parts: string[]): Consumable | null => {
  if (parts[3] === "sushi") return null;

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

export async function checkConsumablesVersion() {
  return (
    await Promise.all(
      CONSUMABLES_FILES.map(([name, file, version]) =>
        checkVersion(name, file, version),
      ),
    )
  ).every(Boolean);
}

export async function loadConsumables(): Promise<{
  size: number;
  data: Consumable[];
}> {
  const fakeItems = (
    await Promise.all([
      loadMafiaData("cafe_food", 0),
      loadMafiaData("cafe_booze", 0),
    ])
  )
    .filter((i) => i !== null)
    .flatMap(({ data }) => data)
    .map((i) => i[1]);

  const data = (
    await Promise.all(
      CONSUMABLES_FILES.map(
        async ([, file]) => [file, await loadMafiaData(file, 0)] as const,
      ),
    )
  )
    .filter(([, d]) => d !== null)
    .flatMap(
      ([type, d]) =>
        d?.data
          .filter((p) => p.length > 7)
          .filter((p) => !fakeItems.includes(p[0]))
          .map((d) => parseConsumable(type, d))
          .filter((d) => d !== null) ?? [],
    );

  const combined = data.reduce<Record<string, Consumable>>((acc, c) => {
    if (acc[c.id]) {
      acc[c.id].stomach += c.stomach;
      acc[c.id].liver += c.liver;
      acc[c.id].spleen += c.spleen;
    } else {
      acc[c.id] = c;
    }
    return acc;
  }, {});

  return {
    size: 0,
    data: [...Object.values(combined)],
  };
}

export async function populateConsumables() {
  const consumables = await loadConsumables();
  const quality = await defineEnum("ConsumableQuality", ConsumableQuality);
  await populateEntity(
    consumables.data,
    "consumables",
    [
      ["id", "INTEGER NOT NULL PRIMARY KEY REFERENCES items(id)"],
      ["stomach", "INTEGER NOT NULL"],
      ["liver", "INTEGER NOT NULL"],
      ["spleen", "INTEGER NOT NULL"],
      ["levelRequirement", "INTEGER NOT NULL"],
      ["quality", `${quality}`],
      ["adventureRange", "TEXT NOT NULL"],
      ["adventures", "REAL NOT NULL"],
      ["muscle", "REAL NOT NULL"],
      ["muscleRange", "TEXT NOT NULL"],
      ["mysticality", "REAL NOT NULL"],
      ["mysticalityRange", "TEXT NOT NULL"],
      ["moxie", "REAL NOT NULL"],
      ["moxieRange", "TEXT NOT NULL"],
      ["notes", "TEXT"],
    ],
    async (consumable) => {
      const id = await resolveReference("items", "name", consumable.id);
      if (!id) return null;
      return {
        ...consumable,
        id,
      };
    },
  );
}

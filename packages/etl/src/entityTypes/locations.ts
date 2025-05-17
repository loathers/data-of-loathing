import { defineEnum, populateEntity, resolveReference } from "../db.js";
import {
  checkVersion,
  loadMafiaData,
  memberOfEnumElse,
  tokenizeAttributes,
} from "../utils.js";

const LOCATIONS_VERSION = 6;
const LOCATIONS_FILENAME = "adventures";
const NATIVES_VERSION = 1;
const NATIVES_FILENAME = "combats";

export enum LocationDifficulty {
  None = "none",
  Unknown = "unknown",
  Low = "low",
  Medium = "medium",
  High = "high",
}

const validDifficulty = memberOfEnumElse(
  LocationDifficulty,
  LocationDifficulty.Unknown,
);

export enum LocationEnvironment {
  None = "none",
  Indoor = "indoor",
  Outdoor = "outdoor",
  Underground = "underground",
  Underwater = "underwater",
}

const validEnvironment = memberOfEnumElse(
  LocationEnvironment,
  LocationEnvironment.None,
);

export type LocationType = {
  name: string;
  id: number | null;
  zone: string;
  url: string;
  difficulty: LocationDifficulty;
  environment: LocationEnvironment;
  statRequirement: number;
  /** Water level, for Heavy Rains locations without an environment  */
  waterLevel: number | null;
  /** Location in which one cannot adventure while overdrunk */
  overdrunk: boolean;
  /** Location in which wandering monsters cannot appear */
  nowander: boolean;
};

export type NativeMonster = {
  monster: string;
  weight: number;
  rejection: number;
  parity: 0 | 1 | null;
};

export type NativesType = {
  location: string;
  combatRate: number;
  monsters: NativeMonster[];
};

const parseSnarfblat = (url: string) =>
  Number(url.match(/^adventure=(\d+)$/)?.[1]) || null;

const parseAttributes = (attributesString: string) => {
  const attributes = tokenizeAttributes(attributesString.toLowerCase());

  return {
    difficulty: validDifficulty(attributes["difflevel"]),
    environment: validEnvironment(attributes["env"]),
    statRequirement: Number(attributes["stat"] ?? "0"),
    waterLevel: Number(attributes["level"] ?? null),
    overdrunk: !!attributes["overdrunk"],
    nowander: !!attributes["nowander"],
  };
};

const parseLocation = (parts: string[]): LocationType => ({
  id: parseSnarfblat(parts[1]),
  name: parts[3],
  zone: parts[0],
  url: parts[1],
  ...parseAttributes(parts[2]),
});

const parseNativeMonster = (part: string): NativeMonster => {
  const match = part.match(/(.*?): (-?\d+)(?:([a-z]+)(\d+)?)?/);
  if (!match) return { monster: part, weight: 1, rejection: 0, parity: null };
  const [, name, weight, flag, rejection] = match;
  return {
    monster: name,
    weight: Number(weight),
    rejection: flag === "r" ? Number(rejection ?? 0) : 0,
    parity: flag === "e" ? 1 : flag === "o" ? 0 : null,
  };
};

const parseNatives = (parts: string[]): NativesType => ({
  location: parts[0],
  combatRate: Number(parts[1]),
  monsters: parts.slice(2).map(parseNativeMonster),
});

export async function checkLocationsVersion() {
  return (
    await Promise.all([
      checkVersion("Locations", LOCATIONS_FILENAME, LOCATIONS_VERSION),
      checkVersion("Natives", NATIVES_FILENAME, NATIVES_VERSION),
    ])
  ).every(Boolean);
}

export async function loadLocations() {
  const data = await loadMafiaData(LOCATIONS_FILENAME);
  return data.filter((p) => p.length > 2).map(parseLocation);
}

export async function loadNatives() {
  const data = await loadMafiaData(NATIVES_FILENAME);
  return data.filter((p) => p.length > 1).map(parseNatives);
}

export async function populateLocations() {
  const [environment, difficulty] = await Promise.all([
    defineEnum("LocationEnvironment", LocationEnvironment),
    defineEnum("LocationDifficulty", LocationDifficulty),
  ]);

  const locations = await loadLocations();
  const natives = await loadNatives();

  const combatRateByLocation = natives.reduce<Record<string, number>>(
    (acc, n) => ({ ...acc, [n.location]: n.combatRate }),
    {},
  );

  const locationsWithCombatRate = locations.map((l) => ({
    ...l,
    combatRate: combatRateByLocation[l.name] ?? -1,
  }));

  await populateEntity(locationsWithCombatRate, "locations", [
    ["id", "INTEGER"],
    ["name", "TEXT PRIMARY KEY"],
    ["zone", "TEXT NOT NULL"],
    ["url", "TEXT NOT NULL"],
    ["difficulty", `${difficulty} NOT NULL`],
    ["environment", `${environment} NOT NULL`],
    ["statRequirement", "INTEGER NOT NULL"],
    ["waterLevel", "INTEGER"],
    ["overdrunk", "BOOLEAN NOT NULL"],
    ["nowander", "BOOLEAN NOT NULL"],
    ["combatRate", "INTEGER NOT NULL"],
  ]);

  await populateEntity(
    natives.flatMap((n) =>
      n.monsters.map((m) => ({ ...m, location: n.location })),
    ),
    "nativeMonsters",
    [
      ["location", "TEXT NOT NULL REFERENCES locations(name)"],
      ["monster", "INTEGER NOT NULL REFERENCES monsters(id)"],
      ["weight", "REAL NOT NULL"],
      ["rejection", "REAL NOT NULL"],
      ["parity", "INTEGER"],
    ],
    async (nativeMonster) => {
      const monster = await resolveReference(
        "monsters",
        "name",
        nativeMonster.monster,
      );
      if (!monster) return null;
      return {
        ...nativeMonster,
        monster,
      };
    },
  );
}

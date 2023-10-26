import { populateEntity } from "../db";
import { loadMafiaData, memberOfEnumElse, tokenizeAttributes } from "../utils";

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

export async function loadLocations(): Promise<{
  size: number;
  data: LocationType[];
}>;
export async function loadLocations(
  lastKnownSize: number,
): Promise<{ size: number; data: LocationType[] } | null>;
export async function loadLocations(lastKnownSize = 0) {
  const raw = await loadMafiaData("adventures", lastKnownSize);

  if (raw === null) return null;

  return {
    ...raw,
    data: raw.data.filter((p) => p.length > 2).map(parseLocation),
  };
}

export async function populateLocations() {
  return populateEntity(loadLocations, "locations", [
    ["id", "INTEGER"],
    ["name", "TEXT PRIMARY KEY"],
    ["zone", "TEXT NOT NULL"],
    ["url", "TEXT NOT NULL"],
    ["difficulty", "TEXT NOT NULL"],
    ["environment", "TEXT NOT NULL"],
    ["statRequirement", "INTEGER NOT NULL"],
    ["waterLevel", "INTEGER"],
    ["overdrunk", "BOOLEAN NOT NULL"],
    ["nowander", "BOOLEAN NOT NULL"],
  ]);
}
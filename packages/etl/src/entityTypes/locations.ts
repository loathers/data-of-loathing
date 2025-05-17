import { defineEnum, populateEntity } from "../db.js";
import {
  checkVersion,
  loadMafiaData,
  memberOfEnumElse,
  tokenizeAttributes,
} from "../utils.js";

const VERSION = 6;
const FILENAME = "adventures";

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

export async function checkLocationsVersion() {
  return await checkVersion("Locations", FILENAME, VERSION);
}

export async function loadLocations() {
  const data = await loadMafiaData(FILENAME);
  return data.filter((p) => p.length > 2).map(parseLocation);
}

export async function populateLocations() {
  const locations = await loadLocations();

  const [environment, difficulty] = await Promise.all([
    defineEnum("LocationEnvironment", LocationEnvironment),
    defineEnum("LocationDifficulty", LocationDifficulty),
  ]);

  await populateEntity(locations, "locations", [
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
  ]);
}

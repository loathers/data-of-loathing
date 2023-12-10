import { populateEntity } from "../db";
import { checkVersion, loadMafiaData, memberOfEnumElse } from "../utils";

const VERSION = 5;
const FILENAME = "classskills";

export enum SkillCategory {
  Passive = 0,
  NoncombatItemSummon = 1,
  NoncombatHealing = 2,
  NoncombatNonShruggableEffect = 3,
  NoncombatShruggableEffect = 4,
  Combat = 5,
  OneAtATimeNoncombatSong = 6,
  CombatNoncombatHealing = 7,
  CombatPassive = 8,
  OneAtATimeNoncombatExpression = 9,
  OneAtATimeNoncombatWalk = 10,
  NoncombatHealingPassive = 11,
}

const validType = memberOfEnumElse(SkillCategory, SkillCategory.Passive);

export type SkillType = {
  id: number;
  name: string;
  image: string;
  category: SkillCategory;
  mpCost: number;
  duration: number;
  guildLevel: number | null;
  maxLevel: number | null;
  permable: boolean;
};

const parseAttributes = (id: number, attributesString = "") => {
  const tokens = attributesString.split(",").reduce(
    (acc, attr) => {
      if (!attr.trim()) return acc;
      const [key, value] = attr.split(":");
      return { ...acc, [key.toLowerCase().trim()]: value.trim() };
    },
    {} as Record<string, string>,
  );

  return {
    guildLevel: tokens["level"] ? Number(tokens["level"]) : null,
    maxLevel: tokens["max level"] ? Number(tokens["max level"]) : null,
    permable: tokens["permable"] ? tokens["permable"] === "true" : id < 7000,
  };
};

const parseSkill = (parts: string[]): SkillType => ({
  id: Number(parts[0]),
  name: parts[1],
  image: parts[2] || "nopic.gif",
  category: validType(Number(parts[3])),
  mpCost: Number(parts[4]),
  duration: Number(parts[5]),
  ...parseAttributes(Number(parts[0]), parts[6]),
});

export async function checkSkillsVersion() {
  return await checkVersion("Skills", FILENAME, VERSION);
}

export async function loadSkills(): Promise<{
  size: number;
  data: SkillType[];
}>;
export async function loadSkills(
  lastKnownSize: number,
): Promise<{ size: number; data: SkillType[] } | null>;
export async function loadSkills(lastKnownSize = 0) {
  const raw = await loadMafiaData(FILENAME, lastKnownSize);

  if (raw === null) return null;

  return {
    ...raw,
    data: raw.data.filter((p) => p.length > 2).map(parseSkill),
  };
}

export async function populateSkills() {
  return populateEntity(loadSkills, "skills", [
    ["id", "INTEGER PRIMARY KEY"],
    ["name", "TEXT NOT NULL"],
    ["image", "TEXT NOT NULL"],
    ["category", "INTEGER NOT NULL"],
    ["mpCost", "INTEGER NOT NULL"],
    ["duration", "INTEGER NOT NULL"],
    ["guildLevel", "INTEGER"],
    ["maxLevel", "INTEGER"],
    ["permable", "BOOLEAN NOT NULL"],
  ]);
}

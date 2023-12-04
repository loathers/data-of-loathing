import { populateEntity } from "../db";
import { loadMafiaData, memberOfEnumElse } from "../utils";

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
};

const parseSkill = (parts: string[]): SkillType => ({
  id: Number(parts[0]),
  name: parts[1],
  image: parts[2] || "nopic.gif",
  category: validType(Number(parts[3])),
  mpCost: Number(parts[4]),
  duration: Number(parts[5]),
  guildLevel: parts[6] ? Number(parts[6]) : null,
});

export async function loadSkills(): Promise<{
  size: number;
  data: SkillType[];
}>;
export async function loadSkills(
  lastKnownSize: number,
): Promise<{ size: number; data: SkillType[] } | null>;
export async function loadSkills(lastKnownSize = 0) {
  const raw = await loadMafiaData("classskills", lastKnownSize);

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
  ]);
}

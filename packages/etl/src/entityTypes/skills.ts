import { defineEnum, markAmbiguous, populateEntity } from "../db.js";
import { checkVersion, isMemberOfEnum, loadMafiaData } from "../utils.js";

const VERSION = 6;
const FILENAME = "classskills";

export enum SkillTag {
  Passive = "passive",
  Combat = "combat",
  NonCombat = "nc",
  Heal = "heal",
  ItemSummon = "item",
  Effect = "effect",
  Self = "self",
  Other = "other",
  Song = "song",
  Expression = "expression",
  Walk = "walk",
}

const isValidTag = isMemberOfEnum(SkillTag);

export type SkillType = {
  id: number;
  name: string;
  image: string;
  tags: SkillTag[];
  mpCost: number;
  duration: number;
  guildLevel: number | null;
  maxLevel: number | null;
  permable: boolean;
  ambiguous: boolean;
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
  tags: parts[3]
    .split(",")
    .map((p) => p.trim())
    .filter(isValidTag),
  mpCost: Number(parts[4]),
  duration: Number(parts[5]),
  ambiguous: false,
  ...parseAttributes(Number(parts[0]), parts[6]),
});

export async function checkSkillsVersion() {
  return await checkVersion("Skills", FILENAME, VERSION);
}

export async function loadSkills() {
  const raw = await loadMafiaData(FILENAME);
  return raw.filter((p) => p.length > 2).map(parseSkill);
}

export async function populateSkills() {
  const tag = await defineEnum("SkillTag", SkillTag);
  await populateEntity(loadSkills, "skills", [
    ["id", "INTEGER PRIMARY KEY"],
    ["name", "TEXT NOT NULL"],
    ["image", "TEXT NOT NULL"],
    ["tags", `${tag}[] NOT NULL`],
    ["mpCost", "INTEGER NOT NULL"],
    ["duration", "INTEGER NOT NULL"],
    ["guildLevel", "INTEGER"],
    ["maxLevel", "INTEGER"],
    ["permable", "BOOLEAN NOT NULL"],
    ["ambiguous", "BOOLEAN NOT NULL DEFAULT FALSE"],
  ]);
  await markAmbiguous("skills");
}

import { Skill, SkillTag } from "data-of-loathing";
import { markAmbiguous, populateEntity } from "../db.js";
import { checkVersion, isMemberOfEnum, loadMafiaData } from "../utils.js";

const VERSION = 6;
const FILENAME = "classskills";

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
  const tokens = attributesString.split(",").reduce<Record<string, string>>(
    (acc, attr) => {
      if (!attr.trim()) return acc;
      const [key, value] = attr.split(":");
      return { ...acc, [key.toLowerCase().trim()]: value.trim() };
    },
    {},
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
  await populateEntity(loadSkills, Skill);
  await markAmbiguous("skills");
}

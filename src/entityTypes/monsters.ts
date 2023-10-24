import {
  loadMafiaData,
  memberOfEnumElse,
  notNull,
  tokenizeAttributes,
} from "../utils";

export enum MonsterElement {
  BadSpelling = "bad spelling",
  Cold = "cold",
  Cute = "cute",
  Hot = "hot",
  Shadow = "shadow",
  Spooky = "spooky",
  Sleaze = "sleaze",
  Slime = "slime",
  Supercold = "supercold",
  Stench = "stench",
}

// Might as well have some default, cold works.
const validElement = memberOfEnumElse(MonsterElement, MonsterElement.Cold);

export enum MonsterDropCategory {
  PickpocketOnly = "p",
  NoPickpocket = "n",
  Conditional = "c",
  Fixed = "f",
  Accordion = "a",
}

const validDropCategory = memberOfEnumElse(MonsterDropCategory, null);

export type MonsterDrop = {
  item: string;
  rate: number;
  category: MonsterDropCategory | null;
};

export type MonsterType = {
  article: string;
  attack: number;
  boss: boolean;
  defence: number;
  drippy: boolean;
  drops: MonsterDrop[];
  element: MonsterElement;
  elementalAttack: MonsterElement;
  elementalDefence: MonsterElement;
  elementalResistance: number;
  experience: number | null;
  free: boolean;
  ghost: boolean;
  groupSize: number;
  hp: number;
  id: number;
  image: string[];
  initiative: number;
  itemBlockChance: number;
  lucky: boolean;
  manuel: string | null;
  meat: number;
  monsterLevelMultiplier: number;
  name: string;
  nobanish: boolean;
  nocopy: boolean;
  nomanuel: boolean;
  nowander: boolean;
  phylum: string;
  physicalResistance: number;
  poison: string | null;
  scaling: number;
  scalingCap: number;
  scalingFloor: number;
  skillBlockChance: number;
  snake: boolean;
  spellBlockChance: number;
  sprinkles: [min: number, max: number];
  superlikely: boolean;
  ultrarare: boolean;
  wanderer: boolean;
  wiki: string | null;
};

const parseDrops = (drops: string[]): MonsterDrop[] => {
  return drops
    .map((d) => {
      const match = d.match(/^(.*?) \(([pncfa]?)(\d+)\)$/);
      if (!match) return null;
      return {
        item: match[1],
        rate: Number(match[3] ?? "0"),
        category: validDropCategory(match[2]),
      };
    })
    .filter(notNull);
};

const parseAttributes = (
  attributesString: string,
): Omit<MonsterType, "id" | "name" | "image" | "drops"> => {
  const attributes = tokenizeAttributes(attributesString);

  return {
    article: String(attributes["Article"]),
    attack: Number(attributes["Atk"] ?? "0"),
    boss: !!attributes["BOSS"],
    defence: Number(attributes["Def"] ?? "0"),
    drippy: !!attributes["DRIPPY"],
    element: validElement(attributes["E"]),
    elementalAttack: validElement(attributes["EA"]),
    elementalDefence: validElement(attributes["ED"]),
    elementalResistance: Number(attributes["Elem"] ?? "0"),
    experience: Number(attributes["Exp"] ?? "0") || null,
    free: !!attributes["FREE"],
    ghost: !!attributes["GHOST"],
    groupSize: Number(attributes["Group"] ?? "1"),
    hp: Number(attributes["HP"] ?? "0"),
    initiative: Number(attributes["Init"] ?? "0"),
    itemBlockChance: Number(attributes["Item"] ?? "0") / 100,
    lucky: !!attributes["LUCKY"],
    manuel: String(attributes["Manuel"] ?? "") || null,
    meat: Number(attributes["Meat"] ?? "0"),
    monsterLevelMultiplier: Number(attributes["MLMult"] ?? "1"),
    nobanish: !!attributes["NOBANISH"],
    nocopy: !!attributes["NOCOPY"],
    nomanuel: !!attributes["NOMANUEL"],
    nowander: !!attributes["NOWANDER"],
    phylum: String(attributes["P"]),
    physicalResistance: Number(attributes["Phys"] ?? "0"),
    poison: String(attributes["Poison"] ?? "") || null,
    scaling: Number(attributes["Scale"] ?? "0"),
    scalingCap: Number(attributes["Cap"] ?? "0"),
    scalingFloor: Number(attributes["Floor"] ?? "0"),
    skillBlockChance: Number(attributes["Skill"] ?? "0") / 100,
    snake: !!attributes["SNAKE"],
    spellBlockChance: Number(attributes["Spell"] ?? "0") / 100,
    sprinkles: [
      Number(attributes["SprinkleMin"] ?? "0"),
      Number(attributes["SprinkleMax"] ?? "0"),
    ],
    superlikely: !!attributes["SUPERLIKELY"],
    ultrarare: !!attributes["ULTRARARE"],
    wanderer: !!attributes["WANDERER"],
    wiki: String(attributes["Wiki"] ?? "") || null,
  };
};

const parseMonster = (parts: string[]): MonsterType => ({
  id: Number(parts[1]),
  name: parts[0],
  image: parts[2].split(","),
  drops: parseDrops(parts.slice(4)),
  ...parseAttributes(parts[3]),
});

export async function loadMonsters(): Promise<{
  size: number;
  data: MonsterType[];
}>;
export async function loadMonsters(
  lastKnownSize: number,
): Promise<{ size: number; data: MonsterType[] } | null>;
export async function loadMonsters(lastKnownSize = 0) {
  const raw = await loadMafiaData("monsters", lastKnownSize);

  if (raw === null) return null;

  return {
    ...raw,
    data: raw.data.filter((p) => p.length > 2).map(parseMonster),
  };
}

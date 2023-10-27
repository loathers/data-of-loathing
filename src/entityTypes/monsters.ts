import { defineEnum, populateEntity, resolveReference } from "../db";
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
  attack: number | string;
  boss: boolean;
  defence: number | string;
  drippy: boolean;
  drops: MonsterDrop[];
  element: MonsterElement;
  elementalAttack: MonsterElement;
  elementalDefence: MonsterElement;
  elementalResistance: number | string;
  experience: number | string | null;
  free: boolean;
  ghost: boolean;
  groupSize: number;
  hp: number | string;
  id: number;
  image: string[];
  initiative: number | string;
  itemBlockChance: number;
  lucky: boolean;
  manuel: string | null;
  meat: number | string;
  monsterLevelMultiplier: number | string;
  name: string;
  nobanish: boolean;
  nocopy: boolean;
  nomanuel: boolean;
  nowander: boolean;
  phylum: string;
  physicalResistance: number | string;
  poison: string | null;
  scaling: number | string;
  scalingCap: number | string;
  scalingFloor: number | string;
  skillBlockChance: number;
  snake: boolean;
  spellBlockChance: number;
  sprinkles: [min: number | string, max: number | string];
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

const parseExpression = (exp: string | boolean, fallback = 0) => {
  if (typeof exp === "string" && exp.startsWith("[")) return exp;
  return Number(exp ?? `${fallback}`);
};

const parseAttributes = (
  attributesString: string,
): Omit<MonsterType, "id" | "name" | "image" | "drops"> => {
  const attributes = tokenizeAttributes(attributesString);

  return {
    article: String(attributes["Article"]),
    attack: parseExpression(attributes["Atk"]),
    boss: !!attributes["BOSS"],
    defence: parseExpression(attributes["Def"]),
    drippy: !!attributes["DRIPPY"],
    element: validElement(attributes["E"]),
    elementalAttack: validElement(attributes["EA"]),
    elementalDefence: validElement(attributes["ED"]),
    elementalResistance: parseExpression(attributes["Elem"]),
    experience: parseExpression(attributes["Exp"]) || null,
    free: !!attributes["FREE"],
    ghost: !!attributes["GHOST"],
    groupSize: Number(attributes["Group"] ?? "1"),
    hp: parseExpression(attributes["HP"]),
    initiative: parseExpression(attributes["Init"]),
    itemBlockChance: Number(attributes["Item"] ?? "0") / 100,
    lucky: !!attributes["LUCKY"],
    manuel: String(attributes["Manuel"] ?? "") || null,
    meat: parseExpression(attributes["Meat"]),
    monsterLevelMultiplier: parseExpression(attributes["MLMult"], 1),
    nobanish: !!attributes["NOBANISH"],
    nocopy: !!attributes["NOCOPY"],
    nomanuel: !!attributes["NOMANUEL"],
    nowander: !!attributes["NOWANDER"],
    phylum: String(attributes["P"]),
    physicalResistance: parseExpression(attributes["Phys"]),
    poison: String(attributes["Poison"] ?? "") || null,
    scaling: parseExpression(attributes["Scale"]),
    scalingCap: parseExpression(attributes["Cap"]),
    scalingFloor: parseExpression(attributes["Floor"]),
    skillBlockChance: Number(attributes["Skill"] ?? "0") / 100,
    snake: !!attributes["SNAKE"],
    spellBlockChance: Number(attributes["Spell"] ?? "0") / 100,
    sprinkles: [
      parseExpression(attributes["SprinkleMin"]),
      parseExpression(attributes["SprinkleMax"]),
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

export async function populateMonsters() {
  const monsters = await loadMonsters();

  const uniqueMonsters = monsters.data.filter((m) => m.id !== 0);

  const element = await defineEnum("monsterElement", MonsterElement);

  await populateEntity(uniqueMonsters, "monsters", [
    ["article", "TEXT NOT NULL"],
    ["attack", "TEXT NOT NULL"],
    ["boss", "BOOLEAN NOT NULL"],
    ["defence", "TEXT NOT NULL"],
    ["drippy", "BOOLEAN NOT NULL"],
    ["element", `${element} NOT NULL`],
    ["elementalAttack", `${element} NOT NULL`],
    ["elementalDefence", `${element} NOT NULL`],
    ["elementalResistance", "TEXT NOT NULL"],
    ["experience", "TEXT"],
    ["free", "BOOLEAN NOT NULL"],
    ["ghost", "BOOLEAN NOT NULL"],
    ["groupSize", "INTEGER NOT NULL"],
    ["hp", "TEXT NOT NULL"],
    ["id", "INTEGER PRIMARY KEY"],
    ["image", "TEXT[] NOT NULL"],
    ["initiative", "TEXT NOT NULL"],
    ["itemBlockChance", "REAL NOT NULL"],
    ["lucky", "BOOLEAN NOT NULL"],
    ["manuel", "TEXT"],
    ["meat", "TEXT NOT NULL"],
    ["monsterLevelMultiplier", "TEXT NOT NULL"],
    ["name", "TEXT NOT NULL"],
    ["nobanish", "BOOLEAN NOT NULL"],
    ["nocopy", "BOOLEAN NOT NULL"],
    ["nomanuel", "BOOLEAN NOT NULL"],
    ["nowander", "BOOLEAN NOT NULL"],
    ["phylum", "TEXT NOT NULL"],
    ["physicalResistance", "TEXT NOT NULL"],
    ["poison", "TEXT"],
    ["scaling", "TEXT NOT NULL"],
    ["scalingCap", "TEXT NOT NULL"],
    ["scalingFloor", "TEXT NOT NULL"],
    ["skillBlockChance", "REAL NOT NULL"],
    ["snake", "BOOLEAN NOT NULL"],
    ["spellBlockChance", "REAL NOT NULL"],
    ["sprinkles", "TEXT[] NOT NULL"],
    ["superlikely", "BOOLEAN NOT NULL"],
    ["ultrarare", "BOOLEAN NOT NULL"],
    ["wanderer", "BOOLEAN NOT NULL"],
    ["wiki", "TEXT"],
  ]);

  const monsterDrops = uniqueMonsters.flatMap((m) =>
    m.drops.map((d) => ({ monster: m.id, ...d })),
  );

  const dropCategory = await defineEnum(
    "MonsterDropCategory",
    MonsterDropCategory,
  );

  await populateEntity(
    monsterDrops,
    "monsterDrops",
    [
      ["monster", "INTEGER NOT NULL REFERENCES monsters(id)"],
      ["item", "INTEGER NOT NULL REFERENCES items(id)"],
      ["rate", "INTEGER NOT NULL"],
      ["category", `${dropCategory}`],
    ],
    async (drop) => ({
      ...drop,
      item: await resolveReference("items", "name", drop.item),
    }),
  );
}

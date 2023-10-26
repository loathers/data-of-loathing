import { defineEnum, populateEntity } from "../db";
import { isMemberOfEnum, loadMafiaData } from "../utils";

export enum ItemUse {
  // Primary
  Food = "food",
  Drink = "drink",
  Spleen = "spleen",
  Potion = "potion",
  Avatar = "avatar",
  Usable = "usable",
  Multiple = "multiple",
  Reusable = "reusable",
  Message = "message",
  Grow = "grow",
  PokePill = "pokepill",
  Hat = "hat",
  Weapon = "weapon",
  Sixgun = "sixgun",
  Offhand = "offhand",
  Container = "container",
  Shirt = "shirt",
  Pants = "pants",
  Accessory = "accessory",
  Familiar = "familiar",
  Sticker = "sticker",
  Card = "card",
  Folder = "folder",
  Bootspur = "bootspur",
  Bootskin = "bootskin",
  FoodHelper = "food helper",
  DrinkHelper = "drink helper",
  Zap = "zap",
  Sphere = "sphere",
  Guardian = "guardian",
  // Secondary
  Combat = "combat",
  CombatReusable = "combat reusable",
  Single = "single",
  Solo = "solo",
  Curse = "curse",
  Bounty = "bounty",
  Package = "package",
  Candy = "candy",
  Candy1 = "candy1",
  Candy2 = "candy2",
  Chocolate = "chocolate",
  Fancy = "fancy",
  Paste = "paste",
  Smith = "smith",
  Cook = "cook",
  Mix = "mix",
  Matchable = "matchable",
}

const isValidItemUse = isMemberOfEnum(ItemUse);

export type ItemType = {
  id: number;
  name: string;
  descid: string;
  image: string;
  autosell: number;
  uses: ItemUse[];
  quest: boolean;
  gift: boolean;
  tradeable: boolean;
  discardable: boolean;
  plural?: string;
};

const parseAccess = (accessString: string) => {
  const access = accessString.split(",").map((p) => p.trim());
  return {
    quest: access.includes("q"),
    gift: access.includes("g"),
    tradeable: access.includes("t"),
    discardable: access.includes("d"),
  };
};

const parseItem = (parts: string[]): ItemType => ({
  id: Number(parts[0]),
  name: parts[1],
  descid: parts[2],
  image: parts[3],
  uses: parts[4].split(", ").filter(isValidItemUse),
  ...parseAccess(parts[5]),
  autosell: Number(parts[6]),
  plural: parts[7],
});

export async function loadItems(): Promise<{ size: number; data: ItemType[] }>;
export async function loadItems(
  lastKnownSize: number,
): Promise<{ size: number; data: ItemType[] } | null>;
export async function loadItems(lastKnownSize = 0) {
  const raw = await loadMafiaData("items", lastKnownSize);

  if (raw === null) return null;

  return {
    ...raw,
    data: raw.data.filter((p) => p.length > 2).map(parseItem),
  };
}

export async function populateItems() {
  const use = await defineEnum("ItemUse", ItemUse);
  return populateEntity(loadItems, "items", [
    ["id", "INTEGER PRIMARY KEY"],
    ["name", "TEXT NOT NULL"],
    ["descid", "TEXT UNIQUE"],
    ["image", "TEXT NOT NULL"],
    ["uses", `${use}[] NOT NULL`],
    ["quest", "BOOLEAN NOT NULL"],
    ["gift", "BOOLEAN NOT NULL"],
    ["tradeable", "BOOLEAN NOT NULL"],
    ["discardable", "BOOLEAN NOT NULL"],
    ["autosell", "INTEGER NOT NULL"],
    ["plural", "TEXT"],
  ]);
}

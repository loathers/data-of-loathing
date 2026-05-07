import { Item, ItemUse } from "data-of-loathing";
import { markAmbiguous, populateEntity } from "../db.js";
import { checkVersion, isMemberOfEnum, loadMafiaData } from "../utils.js";

const VERSION = 1;
const FILENAME = "items";

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
  ambiguous: boolean;
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
  ambiguous: false,
});

export async function checkItemsVersion() {
  return await checkVersion("Items", FILENAME, VERSION);
}

export async function loadItems() {
  const raw = await loadMafiaData(FILENAME);
  return raw.filter((p) => p.length > 2).map(parseItem);
}

export async function populateItems() {
  await populateEntity(loadItems, Item);
  await markAmbiguous("items");
}

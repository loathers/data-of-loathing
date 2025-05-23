import { populateEntity, resolveReference } from "../db.js";
import { checkVersion, loadMafiaData } from "../utils.js";
import { ItemUse } from "./items.js";

const VERSION = 2;
const FILENAME = "equipment";

const EQUIPMENT_ITEM_USES = [
  ItemUse.Hat,
  ItemUse.Pants,
  ItemUse.Shirt,
  ItemUse.Weapon,
  ItemUse.Offhand,
  ItemUse.Accessory,
  ItemUse.Container,
];

export type EquipmentType = {
  id: string;
  power: number;
  musRequirement: number;
  mysRequirement: number;
  moxRequirement: number;
  type?: string;
  hands?: number;
};

const parseWeapon = (typeString: string) => {
  if (!typeString) return {};
  const match = /^((\d+)-handed )?(.*?)$/.exec(typeString);
  if (!match) return { type: typeString };
  if (!match[1]) return { type: match[3] };
  return { type: match[3], hands: Number(match[2]) };
};

const parseRequirements = (reqString: string) => {
  const reqs = {
    musRequirement: 0,
    mysRequirement: 0,
    moxRequirement: 0,
  };

  if (reqString === "none") return reqs;

  const match = /(Mus|Mys|Mox): (\d+)/.exec(reqString);
  if (match) {
    reqs[`${match[1].toLowerCase()}Requirement` as keyof typeof reqs] = Number(
      match[2],
    );
  }

  return reqs;
};

const parseEquipment = (parts: string[]): EquipmentType => ({
  id: parts[0],
  power: Number(parts[1]),
  ...parseRequirements(parts[2]),
  ...parseWeapon(parts[3]),
});

export async function checkItemsVersion() {
  return await checkVersion("Equipment", FILENAME, VERSION);
}

export async function loadEquipment() {
  const raw = await loadMafiaData(FILENAME);
  return raw.filter((p) => p.length > 2).map(parseEquipment);
}

export async function populateEquipment() {
  const equipment = await loadEquipment();
  await populateEntity(
    equipment,
    "equipment",
    [
      ["id", "INTEGER NOT NULL PRIMARY KEY REFERENCES items(id)"],
      ["power", "INTEGER NOT NULL"],
      ["musRequirement", "INTEGER NOT NULL"],
      ["mysRequirement", "INTEGER NOT NULL"],
      ["moxRequirement", "INTEGER NOT NULL"],
      ["type", "TEXT"],
      ["hands", "INTEGER"],
    ],
    async (equipment) => {
      const id = await resolveReference<{ id: number; uses: ItemUse[] }>(
        "items",
        "name",
        equipment.id,
        false,
        (item) => EQUIPMENT_ITEM_USES.some((u) => item.uses?.includes(u)),
      );
      return {
        ...equipment,
        id,
      };
    },
  );
}

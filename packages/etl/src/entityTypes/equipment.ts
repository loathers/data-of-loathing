import {
  defineEnum,
  markAmbiguous,
  populateEntity,
  resolveReference,
} from "../db";
import { checkVersion, loadMafiaData } from "../utils";

const VERSION = 2;
const FILENAME = "equipment";

export type EquipmentType = {
  item: string;
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
  item: parts[0],
  power: Number(parts[1]),
  ...parseRequirements(parts[2]),
  ...parseWeapon(parts[3]),
});

export async function checkItemsVersion() {
  return await checkVersion("Equipment", FILENAME, VERSION);
}

export async function loadEquipment(): Promise<{
  size: number;
  data: EquipmentType[];
}>;
export async function loadEquipment(
  lastKnownSize: number,
): Promise<{ size: number; data: EquipmentType[] } | null>;
export async function loadEquipment(lastKnownSize = 0) {
  const raw = await loadMafiaData(FILENAME, lastKnownSize);

  if (raw === null) return null;

  return {
    ...raw,
    data: raw.data.filter((p) => p.length > 2).map(parseEquipment),
  };
}

export async function populateEquipment() {
  await populateEntity(
    loadEquipment,
    "equipment",
    [
      ["item", "INTEGER PRIMARY KEY"],
      ["power", "INTEGER NOT NULL"],
      ["musRequirement", "INTEGER NOT NULL"],
      ["mysRequirement", "INTEGER NOT NULL"],
      ["moxRequirement", "INTEGER NOT NULL"],
      ["type", "TEXT"],
      ["hands", "INTEGER"],
    ],
    async (equipment) => ({
      ...equipment,
      item: await resolveReference("items", "name", equipment.item),
    }),
  );
}

import { defineEnum, populateEntity } from "../db";
import { checkVersion, loadMafiaData, memberOfEnumElse } from "../utils";

const VERSION = 4;
const FILENAME = "statuseffects";

export enum EffectQuality {
  Good = "good",
  Neutral = "neutral",
  Bad = "bad",
}

const validQuality = memberOfEnumElse(EffectQuality, EffectQuality.Neutral);

export type EffectType = {
  id: number;
  name: string;
  image: string;
  descid: string;
  quality: EffectQuality;
  nohookah: boolean;
  nopvp: boolean;
  noremove: boolean;
  song: boolean;
  actions: string[];
};

const parseAttributes = (attributesString?: string) => {
  const attributes =
    attributesString
      ?.split(",")
      .map((p) => p.trim())
      .filter((p) => p !== "none") ?? [];

  return {
    nohookah: attributes.includes("nohookah"),
    nopvp: attributes.includes("nopvp"),
    noremove: attributes.includes("noremove"),
    song: attributes.includes("song"),
  };
};

const parseEffect = (parts: string[]): EffectType => ({
  id: Number(parts[0]),
  name: parts[1],
  image: parts[2],
  descid: parts[3],
  quality: validQuality(parts[4]),
  ...parseAttributes(parts[5]),
  actions: parts[6]?.split("|") ?? [],
});

export async function checkEffectsVersion() {
  return await checkVersion("Effects", FILENAME, VERSION);
}

export async function loadEffects(): Promise<{
  size: number;
  data: EffectType[];
}>;
export async function loadEffects(
  lastKnownSize: number,
): Promise<{ size: number; data: EffectType[] } | null>;
export async function loadEffects(lastKnownSize = 0) {
  const raw = await loadMafiaData(FILENAME, lastKnownSize);

  if (raw === null) return null;

  return {
    ...raw,
    data: raw.data.filter((p) => p.length > 2).map(parseEffect),
  };
}

export async function populateEffects() {
  const quality = await defineEnum("EffectQuality", EffectQuality);
  return populateEntity(loadEffects, "effects", [
    ["id", "INTEGER PRIMARY KEY"],
    ["name", "TEXT NOT NULL"],
    ["descid", "TEXT UNIQUE"],
    ["image", "TEXT NOT NULL"],
    ["quality", `${quality} NOT NULL`],
    ["nohookah", "BOOLEAN NOT NULL"],
    ["nopvp", "BOOLEAN NOT NULL"],
    ["noremove", "BOOLEAN NOT NULL"],
    ["song", "BOOLEAN NOT NULL"],
    ["actions", "TEXT[] NOT NULL"],
  ]);
}

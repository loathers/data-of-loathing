import { defineEnum, populateEntity } from "../db";
import { loadMafiaData, memberOfEnumElse } from "../utils";

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
  attributes: string[];
  actions: string[];
};

const parseEffect = (parts: string[]): EffectType => ({
  id: Number(parts[0]),
  name: parts[1],
  image: parts[2],
  descid: parts[3],
  quality: validQuality(parts[4]),
  attributes:
    parts[5]
      ?.split(",")
      .map((p) => p.trim())
      .filter((p) => p !== "none") ?? [],
  actions: parts[6]?.split("|") ?? [],
});

export async function loadEffects(): Promise<{
  size: number;
  data: EffectType[];
}>;
export async function loadEffects(
  lastKnownSize: number,
): Promise<{ size: number; data: EffectType[] } | null>;
export async function loadEffects(lastKnownSize = 0) {
  const raw = await loadMafiaData("statuseffects", lastKnownSize);

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
    ["attributes", "TEXT[] NOT NULL"],
    ["actions", "TEXT[] NOT NULL"],
  ]);
}

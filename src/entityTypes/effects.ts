import { isMemberOfEnum, loadMafiaData } from "../utils";

export enum EffectQuality {
  Good = "good",
  Neutral = "neutral",
  Bad = "bad",
}

const isValidQuality = isMemberOfEnum(EffectQuality);

export type Effect = {
  id: number;
  name: string;
  image: string;
  descid: string;
  quality: EffectQuality;
  attributes: string[];
  actions: string[];
};

const parseEffect = (parts: string[]): Effect => ({
  id: Number(parts[0]),
  name: parts[1],
  image: parts[2],
  descid: parts[3],
  quality: isValidQuality(parts[4]) ? parts[4] : EffectQuality.Neutral,
  attributes: parts[5]
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p !== "none"),
  actions: parts[6].split("|"),
});

export const loadEffects = async (lastKnownSize?: number) => {
  const raw = await loadMafiaData("statuseffects", lastKnownSize);

  if (raw === null) return null;

  return {
    ...raw,
    data: raw.data.filter((p) => p.length > 2).map(parseEffect),
  };
};

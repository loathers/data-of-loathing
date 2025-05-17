import { expect, test, vi } from "vitest";
import { createFetchResponse, expectNotNull } from "../testUtils.js";
import { dedent } from "ts-dedent";
import { loadConsumables } from "./consumables.js";

global.fetch = vi.fn();

test("Can read consumables", async () => {
  vi.mocked(fetch).mockImplementation(async (url) => {
    if (url.toString().endsWith("fullness.txt")) {
      return createFetchResponse(dedent`
        2
        Boris's bread	1	1	super EPIC	6-8	40-80	0	0	30 Inspired Chef (+10 Muscle, +100% Muscle, +100% Meat Drop)
      `);
    }

    if (url.toString().endsWith("inebriety.txt")) {
      return createFetchResponse(dedent`
        2
        Boris's beer	1	1	EPIC	5-7	20-40	0	0	30 Beery Cool (+5 Muscle, +50% Muscle, +5 Hot Resistance), BEER
      `);
    }

    if (url.toString().endsWith("spleenhit.txt")) {
      return createFetchResponse(dedent`
        2
        Party-in-a-Can&trade;	1	4	crappy	0	1-50	1-50	1-50	50 Party on Your Skin (+50% HP, +50% MP, +5 familiar weight, +3 all res)
      `);
    }

    return createFetchResponse("");
  });

  const consumables = await loadConsumables();

  expectNotNull(consumables);

  expect(consumables).toHaveLength(3);

  expect(consumables).toContainEqual({
    id: "Boris's bread",
    stomach: 1,
    liver: 0,
    spleen: 0,
    levelRequirement: 1,
    quality: "super_EPIC",
    adventureRange: "6-8",
    adventures: 7,
    muscle: 60,
    muscleRange: "40-80",
    mysticality: 0,
    mysticalityRange: "0",
    moxie: 0,
    moxieRange: "0",
    notes: "30 Inspired Chef (+10 Muscle, +100% Muscle, +100% Meat Drop)",
  });

  expect(consumables).toContainEqual({
    id: "Boris's beer",
    stomach: 0,
    liver: 1,
    spleen: 0,
    levelRequirement: 1,
    quality: "EPIC",
    adventureRange: "5-7",
    adventures: 6,
    muscle: 30,
    muscleRange: "20-40",
    mysticality: 0,
    mysticalityRange: "0",
    moxie: 0,
    moxieRange: "0",
    notes: "30 Beery Cool (+5 Muscle, +50% Muscle, +5 Hot Resistance), BEER",
  });

  expect(consumables).toContainEqual({
    id: "Party-in-a-Can&trade;",
    stomach: 0,
    liver: 0,
    spleen: 1,
    levelRequirement: 4,
    quality: "crappy",
    adventureRange: "0",
    adventures: 0,
    muscle: 25.5,
    muscleRange: "1-50",
    mysticality: 25.5,
    mysticalityRange: "1-50",
    moxie: 25.5,
    moxieRange: "1-50",
    notes:
      "50 Party on Your Skin (+50% HP, +50% MP, +5 familiar weight, +3 all res)",
  });
});

test("Can combined consumables that take multiple organs", async () => {
  vi.mocked(fetch).mockImplementation(async (url) => {
    if (url.toString().endsWith("fullness.txt")) {
      return createFetchResponse(dedent`
        2
        green drunki-bear	4	6	EPIC	22-26	0	200-240	0	4 Fullness 80 Gummibrain (+100 Myst)
      `);
    }

    if (url.toString().endsWith("inebriety.txt")) {
      return createFetchResponse(dedent`
        2
        green drunki-bear	4	6	EPIC	22-26	0	200-240	0	4 Fullness 80 Gummibrain (+100 Myst)
      `);
    }

    return createFetchResponse("");
  });

  const consumables = await loadConsumables();

  expectNotNull(consumables);

  expect(consumables).toHaveLength(1);

  expect(consumables).toContainEqual({
    adventureRange: "22-26",
    adventures: 24,
    id: "green drunki-bear",
    levelRequirement: 6,
    liver: 4,
    moxie: 0,
    moxieRange: "0",
    muscle: 0,
    muscleRange: "0",
    mysticality: 220,
    mysticalityRange: "200-240",
    notes: "4 Fullness 80 Gummibrain (+100 Myst)",
    quality: "EPIC",
    spleen: 0,
    stomach: 4,
  });
});

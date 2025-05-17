import { expect, test, vi } from "vitest";
import { dedent } from "ts-dedent";
import { createFetchResponse, expectNotNull } from "../testUtils.js";
import {
  LocationDifficulty,
  LocationEnvironment,
  loadLocations,
  loadNatives,
} from "./locations.js";

global.fetch = vi.fn();

test("Can read locations", async () => {
  vi.mocked(fetch).mockResolvedValue(
    createFetchResponse(dedent`
      1
      Hobopolis	adventure=168	DiffLevel: unknown Env: underground Stat: 350	Burnbarrel Blvd.	+1 jar of squeeze
      # No snarfblat
      Gyms	clan_gym=MUSCLE	DiffLevel: none Env: none Stat: 0	Pump Up Muscle
      # Water level
      Manor0	place=manor4_chamberboss	DiffLevel: none Env: none Stat: 0 Level: 4	Summoning Chamber
      # Nowander
      HiddenCity	adventure=346	DiffLevel: high Env: outdoor Stat: 140 nowander	An Overgrown Shrine (Northwest)
    `),
  );

  const locations = await loadLocations();

  expectNotNull(locations);

  expect(locations).toHaveLength(4);

  expect(locations).toContainEqual({
    id: 168,
    name: "Burnbarrel Blvd.",
    zone: "Hobopolis",
    url: "adventure=168",
    difficulty: LocationDifficulty.Unknown,
    environment: LocationEnvironment.Underground,
    statRequirement: 350,
    waterLevel: 0,
    overdrunk: false,
    nowander: false,
  });

  expect(locations).toContainEqual({
    id: null,
    name: "Pump Up Muscle",
    zone: "Gyms",
    url: "clan_gym=MUSCLE",
    difficulty: LocationDifficulty.None,
    environment: LocationEnvironment.None,
    statRequirement: 0,
    waterLevel: 0,
    overdrunk: false,
    nowander: false,
  });

  expect(locations).toContainEqual({
    id: null,
    name: "Summoning Chamber",
    zone: "Manor0",
    url: "place=manor4_chamberboss",
    difficulty: LocationDifficulty.None,
    environment: LocationEnvironment.None,
    statRequirement: 0,
    waterLevel: 4,
    overdrunk: false,
    nowander: false,
  });

  expect(locations).toContainEqual({
    id: 346,
    name: "An Overgrown Shrine (Northwest)",
    zone: "HiddenCity",
    url: "adventure=346",
    difficulty: LocationDifficulty.High,
    environment: LocationEnvironment.Outdoor,
    statRequirement: 140,
    waterLevel: 0,
    overdrunk: false,
    nowander: true,
  });
});

test("Can read native monsters", async () => {
  vi.mocked(fetch).mockResolvedValue(
    createFetchResponse(dedent`
      1
      12 West Main	100	board games elemental: 1r50	nerd rapper: 1r50	stumbling-drunk congoer (female)	stumbling-drunk congoer (male)
      # Conditional
      Porkham Asylum	100	mid-level mook	former inmate	former guard	The Author: 0
      # Parity
      The Fungus Plains	100	Blooper	Bullet Bill	Buzzy Beetle: 1e	Goomba: 1o	Koopa Troopa
      # Ultra rare
      A Mob of Zeppelin Protesters	90	Blue Oyster cultist	eagle	fleet woodsman	Jefferson pilot	lynyrd skinner	The Nuge: -1
      # No monsters
      A Crowd of (Stat) Adventurers	100
    `),
  );

  const natives = await loadNatives();

  expectNotNull(natives);

  expect(natives).toHaveLength(5);

  expect(natives).toContainEqual({
    location: "12 West Main",
    combatRate: 100,
    monsters: [
      {
        monster: "board games elemental",
        weight: 1,
        rejection: 50,
        parity: null,
      },
      { monster: "nerd rapper", weight: 1, rejection: 50, parity: null },
      {
        monster: "stumbling-drunk congoer (female)",
        weight: 1,
        rejection: 0,
        parity: null,
      },
      {
        monster: "stumbling-drunk congoer (male)",
        weight: 1,
        rejection: 0,
        parity: null,
      },
    ],
  });

  expect(natives).toContainEqual({
    location: "Porkham Asylum",
    combatRate: 100,
    monsters: [
      { monster: "mid-level mook", weight: 1, rejection: 0, parity: null },
      { monster: "former inmate", weight: 1, rejection: 0, parity: null },
      { monster: "former guard", weight: 1, rejection: 0, parity: null },
      { monster: "The Author", weight: 0, rejection: 0, parity: null },
    ],
  });

  expect(natives).toContainEqual({
    location: "The Fungus Plains",
    combatRate: 100,
    monsters: [
      { monster: "Blooper", weight: 1, rejection: 0, parity: null },
      { monster: "Bullet Bill", weight: 1, rejection: 0, parity: null },
      { monster: "Buzzy Beetle", weight: 1, rejection: 0, parity: 1 },
      { monster: "Goomba", weight: 1, rejection: 0, parity: 0 },
      { monster: "Koopa Troopa", weight: 1, rejection: 0, parity: null },
    ],
  });

  expect(natives).toContainEqual({
    location: "A Mob of Zeppelin Protesters",
    combatRate: 90,
    monsters: [
      { monster: "Blue Oyster cultist", weight: 1, rejection: 0, parity: null },
      { monster: "eagle", weight: 1, rejection: 0, parity: null },
      { monster: "fleet woodsman", weight: 1, rejection: 0, parity: null },
      { monster: "Jefferson pilot", weight: 1, rejection: 0, parity: null },
      { monster: "lynyrd skinner", weight: 1, rejection: 0, parity: null },
      { monster: "The Nuge", weight: -1, rejection: 0, parity: null },
    ],
  });

  expect(natives).toContainEqual({
    location: "A Crowd of (Stat) Adventurers",
    combatRate: 100,
    monsters: [],
  });
});

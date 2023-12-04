import { expect, test, vi } from "vitest";
import { dedent } from "ts-dedent";
import {
  createFetchResponse,
  expectNotNull,
} from "../../packages/functions/src/testUtils";
import {
  LocationDifficulty,
  LocationEnvironment,
  loadLocations,
} from "./locations";

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

  expect(locations.size).toBe(414);

  expect(locations.data).toHaveLength(4);

  expect(locations.data).toContainEqual({
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

  expect(locations.data).toContainEqual({
    id: -1,
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

  expect(locations.data).toContainEqual({
    id: -1,
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

  expect(locations.data).toContainEqual({
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

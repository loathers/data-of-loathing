import { expect, test, vi } from "vitest";
import { createFetchResponse, expectNotNull } from "../testUtils.js";
import { loadModifiers } from "./modifiers.js";
import { dedent } from "ts-dedent";

global.fetch = vi.fn();

test("Can read modifiers", async () => {
  vi.mocked(fetch).mockResolvedValue(
    createFetchResponse(dedent`
      3
      Item	tiny gold medal	Familiar Weight: +10, Experience (familiar): +1, Lasts Until Rollover, Generic
    `),
  );

  const modifiers = await loadModifiers();

  expectNotNull(modifiers);

  expect(modifiers.size).toBe(101);

  expect(modifiers.data).toHaveLength(1);

  expect(modifiers.data).toContainEqual({
    type: "Item",
    thing: "tiny gold medal",
    modifiers: {
      "Familiar Weight": "+10",
      "Experience (familiar)": "+1",
      "Lasts Until Rollover": "true",
      Generic: "true",
    },
  });
});

test.each([
  [
    'Item	Ancient Saucehelm	Mysticality: +11, Spell Damage: +11, Class: "Sauceror", Familiar Effect: "3xGhuol, cap 25"',
    {
      Class: '"Sauceror"',
      "Familiar Effect": '"3xGhuol, cap 25"',
      Mysticality: "+11",
      "Spell Damage": "+11",
    },
  ],
])("Can split complex modifiers", async (line, mods) => {
  vi.mocked(fetch).mockResolvedValue(
    createFetchResponse(dedent`
      3
      ${line}
    `),
  );

  const modifiers = await loadModifiers();

  expectNotNull(modifiers);

  expect(modifiers.data[0].modifiers).toEqual(mods);
});

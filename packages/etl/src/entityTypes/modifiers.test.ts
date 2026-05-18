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

  expect(modifiers).toHaveLength(1);

  expect(modifiers).toContainEqual({
    type: "Item",
    thing: "tiny gold medal",
    modifiers: [
      { name: "Familiar Weight", value: "+10" },
      { name: "Experience (familiar)", value: "+1" },
      { name: "Lasts Until Rollover", value: "true" },
      { name: "Generic", value: "true" },
    ],
  });
});

test.each([
  [
    'Item	Ancient Saucehelm	Mysticality: +11, Spell Damage: +11, Class: "Sauceror", Familiar Effect: "3xGhuol, cap 25"',
    [
      { name: "Mysticality", value: "+11" },
      { name: "Spell Damage", value: "+11" },
      { name: "Class", value: '"Sauceror"' },
      { name: "Familiar Effect", value: '"3xGhuol, cap 25"' },
    ],
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

  expect(modifiers[0].modifiers).toEqual(mods);
});

test.each([
  [
    // cup of sugar: two Effect + two Effect Duration, order is significant
    'Item	cup of sugar	Effect: "Sugar Rush", Effect Duration: 10, Effect: "Sweet Talkin\'", Effect Duration: 100, Last Available: "2025-08"',
    [
      { name: "Effect", value: '"Sugar Rush"' },
      { name: "Effect Duration", value: "10" },
      { name: "Effect", value: '"Sweet Talkin\'"' },
      { name: "Effect Duration", value: "100" },
      { name: "Last Available", value: '"2025-08"' },
    ],
  ],
  [
    // Uncle Crimbo's hat: two Rollover Effect + two Rollover Effect Duration
    'Item	Uncle Crimbo\'s hat	Adventures: +4, Rollover Effect: "The Spirit of Crimbo", Rollover Effect Duration: 100, Rollover Effect: "Crimbo Nostalgia", Rollover Effect Duration: 100, Last Available: "2016-12"',
    [
      { name: "Adventures", value: "+4" },
      { name: "Rollover Effect", value: '"The Spirit of Crimbo"' },
      { name: "Rollover Effect Duration", value: "100" },
      { name: "Rollover Effect", value: '"Crimbo Nostalgia"' },
      { name: "Rollover Effect Duration", value: "100" },
      { name: "Last Available", value: '"2016-12"' },
    ],
  ],
  [
    // petrified wood water purifier: two Lantern Element
    'Item	petrified wood water purifier	Experience (Mysticality): +3, Meat Drop: +20, Last Available: "2025-12", Lantern: 2, Lantern Element: "Cold", Lantern Element: "Sleaze"',
    [
      { name: "Experience (Mysticality)", value: "+3" },
      { name: "Meat Drop", value: "+20" },
      { name: "Last Available", value: '"2025-12"' },
      { name: "Lantern", value: "2" },
      { name: "Lantern Element", value: '"Cold"' },
      { name: "Lantern Element", value: '"Sleaze"' },
    ],
  ],
  [
    // bottle-rocket crossbow: multiple Conditional Skill (Equipped)
    'Item	bottle-rocket crossbow	Moxie Percent: +15, Meat Drop: +15, Conditional Skill (Equipped): "Fire red bottle-rocket", Conditional Skill (Equipped): "Fire blue bottle-rocket", Conditional Skill (Equipped): "Fire orange bottle-rocket"',
    [
      { name: "Moxie Percent", value: "+15" },
      { name: "Meat Drop", value: "+15" },
      { name: "Conditional Skill (Equipped)", value: '"Fire red bottle-rocket"' },
      { name: "Conditional Skill (Equipped)", value: '"Fire blue bottle-rocket"' },
      {
        name: "Conditional Skill (Equipped)",
        value: '"Fire orange bottle-rocket"',
      },
    ],
  ],
])("Preserves duplicate modifiers in order", async (line, mods) => {
  vi.mocked(fetch).mockResolvedValue(
    createFetchResponse(dedent`
      3
      ${line}
    `),
  );

  const modifiers = await loadModifiers();

  expectNotNull(modifiers);

  expect(modifiers[0].modifiers).toEqual(mods);
});

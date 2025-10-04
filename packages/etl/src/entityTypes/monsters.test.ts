import { expect, test, vi } from "vitest";
import { createFetchResponse, expectNotNull } from "../testUtils.js";
import { MonsterDropCategory, loadMonsters } from "./monsters.js";
import { dedent } from "ts-dedent";

global.fetch = vi.fn();

test("Can read monsters", async () => {
  vi.mocked(fetch).mockResolvedValue(
    createFetchResponse(dedent`
      1
      1335 HaXx0r	141	1335.gif	Atk: 81 Def: 72 HP: 71 Init: 50 Meat: 30 P: dude EA: "bad spelling" Article: a	334 scroll (20)	Dyspepsi-Cola (70)	1337 7r0uZ0RZ (15)	Accordion of Jordion (a100)
    `),
  );

  const monsters = await loadMonsters();

  expectNotNull(monsters);

  expect(monsters).toHaveLength(1);

  expect(monsters).toContainEqual({
    id: 141,
    name: "1335 HaXx0r",
    ambiguous: false,
    image: ["1335.gif"],
    drops: [
      {
        category: null,
        item: "334 scroll",
        rate: 20,
      },
      {
        category: null,
        item: "Dyspepsi-Cola",
        rate: 70,
      },
      {
        category: null,
        item: "1337 7r0uZ0RZ",
        rate: 15,
      },
      {
        category: MonsterDropCategory.Accordion,
        item: "Accordion of Jordion",
        rate: 100,
      },
    ],
    article: "a",
    attack: 81,
    boss: false,
    defence: 72,
    drippy: false,
    element: null,
    elementalAttack: "bad spelling",
    elementalDefence: null,
    elementalResistance: 0,
    experience: null,
    free: false,
    ghost: false,
    groupSize: 1,
    hp: 71,
    initiative: 50,
    itemBlockChance: 0,
    lucky: false,
    manuel: null,
    meat: 30,
    meatExpression: "30",
    monsterLevelMultiplier: 1,
    nobanish: false,
    nocopy: false,
    nomanuel: false,
    nowander: false,
    nowish: false,
    phylum: "dude",
    physicalResistance: 0,
    poison: null,
    scaling: 0,
    scalingCap: 0,
    scalingFloor: 0,
    skillBlockChance: 0,
    snake: false,
    spellBlockChance: 0,
    sprinkles: [0, 0],
    superlikely: false,
    ultrarare: false,
    wanderer: false,
    wiki: null,
    wish: false,
  });
});

test("Can read drops with fractional odds", async () => {
  vi.mocked(fetch).mockResolvedValue(
    createFetchResponse(dedent`
      1
      Gurgle the Turgle	1768	animturtle.gif	NOBANISH Scale: [5+20*pref(dinseyAudienceEngagement)] Cap: 11111 Floor: 100 MLMult: [3+2*pref(dinseyAudienceEngagement)] Init: -10000 P: construct E: stench	turtle voicebox (15)	fake washboard (c0.1)
    `),
  );

  const monsters = await loadMonsters();

  expectNotNull(monsters);

  expect(monsters).toHaveLength(1);

  expect(monsters[0]).toMatchObject({
    drops: [
      {
        category: null,
        item: "turtle voicebox",
        rate: 15,
      },
      {
        category: "c",
        item: "fake washboard",
        rate: 0.1,
      },
    ],
  });
});

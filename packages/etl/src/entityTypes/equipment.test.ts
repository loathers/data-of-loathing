import { expect, test, vi } from "vitest";
import { dedent } from "ts-dedent";

import { createFetchResponse, expectNotNull } from "../testUtils.js";
import { loadEquipment } from "./equipment.js";

global.fetch = vi.fn();

test("Can read equipment", async () => {
  vi.mocked(fetch).mockResolvedValue(
    createFetchResponse(dedent`
      2
      brown pirate pants\t100\tnone
    `),
  );

  const equips = await loadEquipment();

  expectNotNull(equips);

  expect(equips).toHaveLength(1);

  const equip = equips[0];

  expect(equip).toMatchObject({
    id: "brown pirate pants",
    power: 100,
    musRequirement: 0,
    mysRequirement: 0,
    moxRequirement: 0,
  });
});

test("Can read equipment with requirements", async () => {
  vi.mocked(fetch).mockResolvedValue(
    createFetchResponse(dedent`
      2
      Baron von Ratsworth's monocle\t50\tMys: 10
    `),
  );

  const equips = await loadEquipment();
  const equip = equips[0];

  expect(equip).toMatchObject({
    id: "Baron von Ratsworth's monocle",
    power: 50,
    musRequirement: 0,
    mysRequirement: 10,
    moxRequirement: 0,
  });
});

test("Can read weapons", async () => {
  vi.mocked(fetch).mockResolvedValue(
    createFetchResponse(dedent`
      2
      beer-a-pult	190	Mox: 80	3-handed catapult
    `),
  );

  const equips = await loadEquipment();
  const equip = equips[0];

  expect(equip).toMatchObject({
    id: "beer-a-pult",
    power: 190,
    musRequirement: 0,
    mysRequirement: 0,
    moxRequirement: 80,
    type: "catapult",
    hands: 3,
  });
});

test("Can read shields", async () => {
  vi.mocked(fetch).mockResolvedValue(
    createFetchResponse(dedent`
      2
      radiator heater shield	100	Mus: 35	shield
    `),
  );

  const equips = await loadEquipment();
  const equip = equips[0];

  expect(equip).toMatchObject({
    id: "radiator heater shield",
    power: 100,
    musRequirement: 35,
    mysRequirement: 0,
    moxRequirement: 0,
    type: "shield",
  });
});

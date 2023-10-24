import { expect, test, vi } from "vitest";
import { createFetchResponse, expectNotNull } from "../testUtils";
import { FamiliarCategory, loadFamiliars } from "./familiars";

global.fetch = vi.fn();

test("Can read familiars", async () => {
  vi.mocked(fetch).mockResolvedValue(
    createFetchResponse(
      "1\n7\tSpooky Pirate Skeleton\tfamiliar7.gif\tcombat1,delevel\tspooky pirate skeleton\tblundarrrbus\t2\t3\t1\t0\thashands,haseyes,undead,cantalk",
    ),
  );

  const familiars = await loadFamiliars();

  expectNotNull(familiars);

  expect(familiars.data.length).toBe(1);

  const familiar = familiars.data[0];

  expect(familiar).toMatchObject({
    id: 7,
    name: "Spooky Pirate Skeleton",
    image: "familiar7.gif",
    categories: [FamiliarCategory.Combat1, FamiliarCategory.Delevel],
    larva: "spooky pirate skeleton",
    equipment: "blundarrrbus",
    arenaStats: {
      cageMatch: 2,
      hideAndSeek: 0,
      obstacleCourse: 1,
      scavengerHunt: 3,
    },
    attributes: ["hashands", "haseyes", "undead", "cantalk"],
  });
});

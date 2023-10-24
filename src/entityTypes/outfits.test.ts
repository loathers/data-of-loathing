import { expect, test, vi } from "vitest";
import { createFetchResponse, expectNotNull } from "../testUtils";
import { loadOutfits } from "./outfits";

global.fetch = vi.fn();

test("Can read items", async () => {
  vi.mocked(fetch).mockResolvedValue(
    createFetchResponse(
      "1\n35\tBlack Armaments\tblacktat.gif\tblack helmet, black sword, black shield, black greaves\tblack pudding (0.16), Blackfly Chardonnay (0.16), black & tan (0.16), black pepper (0.16), black forest cake (0.16), black forest ham (0.16)",
    ),
  );

  const outfits = await loadOutfits();

  expectNotNull(outfits);

  expect(outfits.size).toBe(229);

  expect(outfits.data).toHaveLength(1);

  const outfit = outfits.data[0];

  expect(outfit).toMatchObject({
    id: 35,
    name: "Black Armaments",
    image: "blacktat.gif",
    equipment: ["black helmet", "black sword", "black shield", "black greaves"],
    treats: [
      { item: "black pudding", chance: 0.16 },
      { item: "Blackfly Chardonnay", chance: 0.16 },
      { item: "black & tan", chance: 0.16 },
      { item: "black pepper", chance: 0.16 },
      { item: "black forest cake", chance: 0.16 },
      { item: "black forest ham", chance: 0.16 },
    ],
  });
});

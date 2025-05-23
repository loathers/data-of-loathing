import { expect, test, vi } from "vitest";
import { dedent } from "ts-dedent";

import { createFetchResponse, expectNotNull } from "../testUtils.js";
import { loadOutfits } from "./outfits.js";

global.fetch = vi.fn();

test("Can read outfits", async () => {
  vi.mocked(fetch).mockResolvedValue(
    createFetchResponse(dedent`
      1
      35\tBlack Armaments\tblacktat.gif\tblack helmet, black sword, black shield, black greaves\tblack pudding (0.16), Blackfly Chardonnay (0.16), black & tan (0.16), black pepper (0.16), black forest cake (0.16), black forest ham (0.16)
    `),
  );

  const outfits = await loadOutfits();

  expectNotNull(outfits);

  expect(outfits).toHaveLength(1);

  const outfit = outfits[0];

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

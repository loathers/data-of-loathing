import { expect, test, vi } from "vitest";
import { dedent } from "ts-dedent";

import { createFetchResponse, expectNotNull } from "../testUtils.js";
import { ItemUse, loadItems } from "./items.js";

global.fetch = vi.fn();

test("Can read items", async () => {
  vi.mocked(fetch).mockResolvedValue(
    createFetchResponse(dedent`
      1
      87\tmeat from yesterday\t653772183\tmeat.gif\tnone, paste\tt,d\t5\tmeats from yesterday
    `),
  );

  const items = await loadItems();

  expectNotNull(items);

  expect(items).toHaveLength(1);

  const item = items[0];

  expect(item).toMatchObject({
    id: 87,
    name: "meat from yesterday",
    descid: "653772183",
    image: "meat.gif",
    uses: [ItemUse.Paste],
    quest: false,
    gift: false,
    tradeable: true,
    discardable: true,
    autosell: 5,
    plural: "meats from yesterday",
  });
});

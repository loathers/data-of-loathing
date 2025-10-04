import { expect, test, vi } from "vitest";
import { dedent } from "ts-dedent";

import { createFetchResponse, expectNotNull } from "../testUtils.js";
import { loadZapGroups } from "./zapGroups.js";

global.fetch = vi.fn();

test("Can read items", async () => {
  vi.mocked(fetch).mockResolvedValue(
    createFetchResponse(dedent`
      1
      cursed eyepatch, cursed cutlass, cursed breeches
      carob brownies, chorizo brownies, herb brownies
    `),
  );

  const zapGroups = await loadZapGroups();

  expectNotNull(zapGroups);

  expect(zapGroups).toHaveLength(2);

  const group = zapGroups[0];

  expect(group).toMatchObject({
    id: 0,
    items: ["cursed eyepatch", "cursed cutlass", "cursed breeches"],
  });
});

test("Can read items with commas", async () => {
  vi.mocked(fetch).mockResolvedValue(
    createFetchResponse(dedent`
      1
      item with comma\\, in name, another item
    `),
  );

  const zapGroups = await loadZapGroups();

  expectNotNull(zapGroups);

  expect(zapGroups).toHaveLength(1);

  const group = zapGroups[0];

  expect(group).toMatchObject({
    id: 0,
    items: ["item with comma, in name", "another item"],
  });
});

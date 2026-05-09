import { expect, test, vi } from "vitest";

import { createFetchResponse, expectNotNull } from "../testUtils.js";
import { loadFoldGroups } from "./foldGroups.js";

global.fetch = vi.fn();

test("Can read fold groups", async () => {
  vi.mocked(fetch).mockResolvedValue(
    createFetchResponse(
      "1\n0\tturtle wax shield\tturtle wax helmet\tturtle wax greaves\n0\tbeer helmet\tbeer bong\tdistressed denim pants",
    ),
  );

  const foldGroups = await loadFoldGroups();

  expectNotNull(foldGroups);

  expect(foldGroups).toHaveLength(2);

  const group = foldGroups[0];

  expect(group).toMatchObject({
    id: 0,
    damage: 0,
    items: ["turtle wax shield", "turtle wax helmet", "turtle wax greaves"],
  });
});

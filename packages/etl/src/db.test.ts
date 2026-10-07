import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { beforeAll, expect, test } from "vitest";
import { Equipment, Item } from "data-of-loathing";

import { initialiseDatabase, openDatabase, populateEntity } from "./db.js";

const path = join(mkdtempSync(join(tmpdir(), "dol-")), "test.db");

beforeAll(async () => {
  await openDatabase(path);
  await initialiseDatabase();
});

test("populateEntity keeps columns missing from the first row", async () => {
  const item = (id: number) => ({
    id,
    name: `item ${id}`,
    image: "",
    descid: null,
    uses: [],
    quest: false,
    gift: false,
    tradeable: true,
    discardable: true,
    autosell: 0,
    plural: null,
    ambiguous: false,
  });
  await populateEntity([item(1), item(2)], Item);

  await populateEntity(
    [
      {
        item: 1,
        power: 100,
        musRequirement: 0,
        mysRequirement: 0,
        moxRequirement: 0,
      },
      {
        item: 2,
        power: 190,
        musRequirement: 0,
        mysRequirement: 0,
        moxRequirement: 80,
        type: "catapult",
        hands: 3,
      },
    ],
    Equipment,
  );

  const row = new DatabaseSync(path)
    .prepare(`SELECT * FROM "equipment" WHERE "id" = 2`)
    .get();
  expect(row).toMatchObject({ type: "catapult", hands: 3 });
});

import { afterEach, expect, test, vi } from "vitest";
import { Concoction, Ingredient, Item } from "data-of-loathing";
import {
  checkExists,
  initialiseDatabase,
  openDatabase,
  populateEntity,
} from "./db.js";

afterEach(() => {
  vi.restoreAllMocks();
});

const seedItem = (id: number) => ({
  id,
  name: `item ${id}`,
  image: "x.gif",
  uses: [],
  quest: false,
  gift: false,
  tradeable: true,
  discardable: true,
  autosell: 0,
});

test("populateEntity drops rows with a null in a NOT NULL column and warns", async () => {
  await openDatabase(":memory:");
  await initialiseDatabase();
  await populateEntity([seedItem(10)], Item);

  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

  // `item` is a NOT NULL foreign key; the second row has none and must be
  // dropped rather than crash the insert.
  await populateEntity(
    [
      { id: 1, item: 10, methods: ["COMBINE"], comment: null },
      { id: 2, item: null, methods: ["COMBINE"], comment: null },
    ],
    Concoction,
  );

  expect(await checkExists("concoctions", "id", "1")).toBe(true);
  expect(await checkExists("concoctions", "id", "2")).toBe(false);
  expect(warn).toHaveBeenCalledWith(
    expect.stringContaining(`required field "item" is null`),
  );
});

test("populateEntity drops rows whose foreign key references a missing parent", async () => {
  await openDatabase(":memory:");
  await initialiseDatabase();
  await populateEntity([seedItem(10)], Item);
  // Concoction 1 exists; concoction 2 was dropped (never inserted).
  await populateEntity(
    [{ id: 1, item: 10, methods: ["COMBINE"], comment: null }],
    Concoction,
  );

  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

  await populateEntity(
    [
      { id: 1, concoction: 1, item: 10, quantity: 1 },
      { id: 2, concoction: 2, item: 10, quantity: 1 },
    ],
    Ingredient,
  );

  expect(await checkExists("ingredients", "id", "1")).toBe(true);
  expect(await checkExists("ingredients", "id", "2")).toBe(false);
  expect(warn).toHaveBeenCalledWith(
    expect.stringContaining(
      `foreign key "concoction" -> concoctions(2) not found`,
    ),
  );
});

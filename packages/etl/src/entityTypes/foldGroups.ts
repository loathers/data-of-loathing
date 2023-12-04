import { populateEntity, resolveReference } from "../db";
import { loadMafiaData } from "../utils";

export type FoldGroupType = {
  id: number;
  damage: number;
  items: string[];
};

const parseFoldGroup = (parts: string[], index: number): FoldGroupType => ({
  id: index,
  damage: Number(parts[0]),
  items: parts.slice(1),
});

export async function loadFoldGroups(): Promise<{
  size: number;
  data: FoldGroupType[];
}>;
export async function loadFoldGroups(
  lastKnownSize: number,
): Promise<{ size: number; data: FoldGroupType[] } | null>;
export async function loadFoldGroups(lastKnownSize = 0) {
  const raw = await loadMafiaData("foldgroups", lastKnownSize);

  if (raw === null) return null;

  return {
    ...raw,
    data: raw.data.filter((p) => p.length > 2).map(parseFoldGroup),
  };
}

export async function populateFoldGroups() {
  const { data } = await loadFoldGroups();

  await populateEntity(data, "foldGroups", [
    ["id", "INTEGER PRIMARY KEY"],
    ["damage", "INTEGER NOT NULL"],
  ]);

  const junctionTable = data.flatMap(({ id, items }) =>
    items.map((item) => ({ foldGroup: id, item })),
  );

  await populateEntity(
    junctionTable,
    "foldables",
    [
      ["foldGroup", `INTEGER REFERENCES "foldGroups" (id)`],
      ["item", "INTEGER REFERENCES items(id)"],
    ],
    async (foldable) => ({
      ...foldable,
      item: await resolveReference("items", "name", foldable.item),
    }),
  );
}

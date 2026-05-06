import { populateEntity, resolveReference } from "../db.js";
import { checkVersion, loadMafiaData } from "../utils.js";

const VERSION = 1;
const FILENAME = "foldgroups";

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

export async function checkFoldGroupsVersion() {
  return await checkVersion("Fold Groups", FILENAME, VERSION);
}

export async function loadFoldGroups() {
  const raw = await loadMafiaData(FILENAME);
  return raw.filter((p) => p.length > 2).map(parseFoldGroup);
}

export async function populateFoldGroups() {
  const data = await loadFoldGroups();

  await populateEntity(data, "foldGroups", ["id", "damage"]);

  const junctionTable = data.flatMap(({ id, items }) =>
    items.map((item) => ({ foldGroup: id, item })),
  );

  await populateEntity(
    junctionTable,
    "foldables",
    ["foldGroup", "item"],
    async (foldable) => ({
      ...foldable,
      item: await resolveReference("foldGroup", "items", "name", foldable.item),
    }),
  );
}

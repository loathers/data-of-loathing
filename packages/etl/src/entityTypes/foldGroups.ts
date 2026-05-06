import { FoldGroup } from "data-of-loathing-schema";
import { populateEntity, populatePivot, resolveReference } from "../db.js";
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

  await populateEntity(
    data.map(({ items: _, ...g }) => g),
    FoldGroup,
  );

  const pivotRows: { foldGroup: number; item: number | null }[] = [];
  for (const group of data) {
    for (const name of group.items) {
      const itemId = await resolveReference("foldGroup", "items", "name", name);
      pivotRows.push({ foldGroup: group.id, item: itemId });
    }
  }

  await populatePivot(
    "foldables",
    ["foldGroup", "item"],
    pivotRows.filter((r) => r.item !== null) as Record<string, unknown>[],
  );
}

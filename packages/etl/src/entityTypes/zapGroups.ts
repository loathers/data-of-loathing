import { ZapGroup } from "data-of-loathing";
import { populateEntity, populatePivot, resolveReference } from "../db.js";
import { checkVersion, loadMafiaData } from "../utils.js";

const VERSION = 1;
const FILENAME = "zapgroups";

export type ZapGroupType = {
  id: number;
  items: string[];
};

const parseZapGroup = (parts: string[], index: number): ZapGroupType => ({
  id: index,
  items: parts[0]
    .replace("\\,", "💀")
    .split(",")
    .map((p) => p.replace("💀", ","))
    .map((s) => s.trim()),
});

export async function checkZapGroupsVersion() {
  return await checkVersion("Zap Groups", FILENAME, VERSION);
}

export async function loadZapGroups() {
  const raw = await loadMafiaData(FILENAME);
  return raw.filter((p) => p.length > 0).map(parseZapGroup);
}

export async function populateZapGroups() {
  const data = await loadZapGroups();

  await populateEntity(
    data.map(({ items: _, ...g }) => g),
    ZapGroup,
  );

  const pivotRows: { zapGroup: number; item: number | null }[] = [];
  for (const group of data) {
    for (const name of group.items) {
      const itemId = await resolveReference("zapGroup", "items", "name", name);
      pivotRows.push({ zapGroup: group.id, item: itemId });
    }
  }

  await populatePivot(
    "zapGroupItems",
    ["zapGroup", "item"],
    pivotRows.filter((r) => r.item !== null),
  );
}

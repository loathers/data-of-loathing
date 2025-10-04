import { populateEntity, resolveReference } from "../db.js";
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

  await populateEntity(data, "zapGroups", [["id", "INTEGER PRIMARY KEY"]]);

  const junctionTable = data.flatMap(({ id, items }) =>
    items.map((item) => ({ zapGroup: id, item })),
  );

  await populateEntity(
    junctionTable,
    "zapGroupItems",
    [
      ["zapGroup", `INTEGER REFERENCES "zapGroups" (id)`],
      ["item", "INTEGER REFERENCES items(id)"],
    ],
    async (zapGroupItem) => ({
      ...zapGroupItem,
      item: await resolveReference(
        "zapGroup",
        "items",
        "name",
        zapGroupItem.item,
      ),
    }),
  );
}

import { Zone } from "data-of-loathing";
import { populateEntity } from "../db.js";
import { checkVersion, loadMafiaData } from "../utils.js";

const VERSION = 2;
const FILENAME = "zonelist";

export async function checkZonesVersion() {
  return await checkVersion("Zones", FILENAME, VERSION);
}

type ZoneType = {
  zone: string;
  parent: string | null;
  description: string;
  accessItem: string | null;
};

const parseZone = (parts: string[]): ZoneType => ({
  zone: parts[0],
  parent: parts[1] === parts[0] ? null : parts[1],
  description: parts[2],
  accessItem: parts[3] ?? null,
});

export async function populateZones() {
  const raw = await loadMafiaData(FILENAME);
  const data = raw.filter((p) => p.length >= 3).map(parseZone);
  await populateEntity(data, Zone);
}

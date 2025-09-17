import type { Endpoints } from "@octokit/types";
import { Cron } from "croner";
import { populateClasses } from "./entityTypes/classes.js";
import { checkEffectsVersion, populateEffects } from "./entityTypes/effects.js";
import {
  checkFamiliarsVersion,
  populateFamiliars,
} from "./entityTypes/familiars.js";
import {
  checkFoldGroupsVersion,
  populateFoldGroups,
} from "./entityTypes/foldGroups.js";
import { checkItemsVersion, populateItems } from "./entityTypes/items.js";
import {
  checkLocationsVersion,
  populateLocations,
} from "./entityTypes/locations.js";
import {
  checkMonstersVersion,
  populateMonsters,
} from "./entityTypes/monsters.js";
import { checkOutfitsVersion, populateOutfits } from "./entityTypes/outfits.js";
import { populatePaths } from "./entityTypes/paths.js";
import { checkSkillsVersion, populateSkills } from "./entityTypes/skills.js";
import { sql } from "./db.js";
import { populateEquipment } from "./entityTypes/equipment.js";
import {
  checkModifiersVersion,
  populateModifiers,
} from "./entityTypes/modifiers.js";
import { populateConsumables } from "./entityTypes/consumables.js";
import {
  checkConcoctionsVersion,
  populateConcoctions,
} from "./entityTypes/concoctions.js";

export async function checkVersions() {
  const checks = await Promise.all([
    checkEffectsVersion(),
    checkFoldGroupsVersion(),
    checkItemsVersion(),
    checkLocationsVersion(),
    checkMonstersVersion(),
    checkOutfitsVersion(),
    checkSkillsVersion(),
    checkFamiliarsVersion(),
    checkModifiersVersion(),
    checkConcoctionsVersion(),
  ]);

  return checks.every((v) => v);
}

export async function populateDatabase() {
  await populateEffects();
  await populateItems();
  await populateEquipment();
  await populatePaths();
  await populateSkills();

  await populateConsumables();
  await populateClasses();
  await populateFamiliars();
  await populateMonsters();

  await populateLocations();
  await populateOutfits();
  await populateFoldGroups();
  await populateModifiers();
  await populateConcoctions();
}

export async function watch(every: number) {
  // When we run watch for the first time, update the database even if the upstream data has not changed. This is because
  // the server may have restarted with code for new data transforms.
  let firstTime = true;

  const job = new Cron(`*/${every} * * * *`, { protect: true }, async () => {
    // If we have a new database, ensure a population by pretending we last checked a long time ago
    await sql`CREATE TABLE IF NOT EXISTS "meta" AS (SELECT '01-01-1970 00:00:00'::timestamp as "lastUpdate")`;
    const { lastUpdate } = (
      await sql<
        { lastUpdate: Date }[]
      >`SELECT "lastUpdate" FROM "meta" LIMIT 1;`
    )[0];
    const lastGitHubUpdates = await Promise.all(
      [
        "/src/data",
        "src/net/sourceforge/kolmafia/AscensionPath.java",
        "src/net/sourceforge/kolmafia/AscensionClass.java",
      ].map(async (path) => {
        const response = await fetch(
          `https://api.github.com/repos/kolmafia/kolmafia/commits?page=1&per_page=1&path=${path}`,
        );
        const json =
          (await response.json()) as Endpoints["GET /repos/{owner}/{repo}/commits"]["response"]["data"];
        return new Date(json[0]?.commit.author?.date ?? 0).getTime();
      }),
    );

    const lastGitHubUpdate = new Date(Math.max(...lastGitHubUpdates));

    if (!firstTime && lastGitHubUpdate <= lastUpdate) {
      console.log(
        "Not updating, last change:",
        lastGitHubUpdate,
        "vs our data:",
        lastUpdate,
      );
      return;
    }

    const check = await checkVersions();

    if (!check) {
      console.log("Cannot update due to mismatched data file versions");
      return;
    }

    await populateDatabase();
    await sql`UPDATE "meta" SET "lastUpdate" = ${lastGitHubUpdate}`;
    firstTime = false;
  });

  await job.trigger();
}

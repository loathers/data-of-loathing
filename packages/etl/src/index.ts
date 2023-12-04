import type { Endpoints } from "@octokit/types";
import Cron from "croner";
import { populateClasses } from "./entityTypes/classes";
import { populateEffects } from "./entityTypes/effects";
import { populateFamiliars } from "./entityTypes/familiars";
import { populateFoldGroups } from "./entityTypes/foldGroups";
import { populateItems } from "./entityTypes/items";
import { populateLocations } from "./entityTypes/locations";
import { populateMonsters } from "./entityTypes/monsters";
import { populateOutfits } from "./entityTypes/outfits";
import { populatePaths } from "./entityTypes/paths";
import { populateSkills } from "./entityTypes/skills";
import { sql } from "./db";

export async function populateDatabase() {
  await Promise.all([
    populateEffects(),
    populateItems(),
    populateLocations(),
    populatePaths(),
    populateSkills(),
  ]);

  await populateClasses();
  await populateFamiliars();
  await populateMonsters();

  await populateOutfits();
  await populateFoldGroups();
}

export async function watch(every: number) {
  const job = Cron(`*/${every} * * * *`, { protect: true }, async () => {
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
        return new Date(json.at(0)?.commit.author?.date ?? 0).getTime();
      }),
    );

    //
    const lastGitHubUpdate = new Date(Math.max(...lastGitHubUpdates));

    if (lastGitHubUpdate <= lastUpdate) return;

    await populateDatabase();
    await sql`UPDATE "meta" SET "lastUpdate" = ${lastGitHubUpdate}`;
  });

  await job.trigger();
}

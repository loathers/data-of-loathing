import { populateClasses } from "./entityTypes/classes";
import { populateEffects } from "./entityTypes/effects";
import { populateFamiliars } from "./entityTypes/familiars";
import { populateItems } from "./entityTypes/items";
import { populateLocations } from "./entityTypes/locations";
import { populateMonsters } from "./entityTypes/monsters";
import { populateOutfits } from "./entityTypes/outfits";
import { populatePaths } from "./entityTypes/paths";
import { populateSkills } from "./entityTypes/skills";

async function main() {
  await Promise.all([
    populateEffects(),
    populateItems().then(() =>
      Promise.all([populateFamiliars(), populateMonsters(), populateOutfits()]),
    ),
    populateLocations(),
    populatePaths().then(() => populateClasses()),
    populateSkills(),
  ]);

  process.exit();
}

main();

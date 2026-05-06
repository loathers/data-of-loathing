import { openDatabase, initialiseDatabase, prepareMeta } from "./db.js";
import { checkVersions, populateDatabase } from "./index.js";

const SQLITE_PATH = process.env.SQLITE_PATH ?? "./dol.sqlite";

async function main() {
  if (!(await checkVersions())) {
    process.exit(1);
  }
  await openDatabase(SQLITE_PATH);
  await initialiseDatabase();
  await prepareMeta();
  await populateDatabase();
  process.exit(0);
}

main();

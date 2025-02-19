import { checkVersions, populateDatabase } from "./index.js";

async function main() {
  if (!(await checkVersions())) {
    process.exit(1);
  }
  await populateDatabase();
  process.exit(0);
}

main();

import { createClient } from "data-of-loathing";

const client = createClient({ strategy: "url", url: "http://localhost:3000/dol.sqlite" });

console.log("Loading…");
const t0 = performance.now();
await client.load();
console.log(`Ready in ${(performance.now() - t0).toFixed(0)}ms\n`);

const em = client.query;

const queries = ["seal tooth", "pregnant gloomy black mushroom", "Staff of the Headmaster's Victuals"];

for (const name of queries) {
  const t1 = performance.now();
  const item = await em.findOne("Item", { name });
  const ms = (performance.now() - t1).toFixed(1);
  if (item) {
    console.log(`[${ms}ms] "${item.name}" — id:${item.id} autosell:${item.autosell}`);
  } else {
    console.log(`[${ms}ms] "${name}" — not found`);
  }
}

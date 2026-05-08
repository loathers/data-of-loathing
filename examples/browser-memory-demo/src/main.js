import { createClient } from "data-of-loathing";

const statusEl = document.getElementById("status");
const searchBtn = document.getElementById("search");
const queryInput = document.getElementById("query");
const resultEl = document.getElementById("result");
const timingEl = document.getElementById("timing");

const client = createClient({ strategy: "memory", url: "http://localhost:3000/dol.sqlite" });

const t0 = performance.now();
try {
  await client.load();
  const ms = (performance.now() - t0).toFixed(0);
  statusEl.textContent = `Ready in ${ms}ms`;
  searchBtn.disabled = false;
} catch (err) {
  console.error(err);
  statusEl.textContent = `Error: ${err}`;
}

const em = client.query;

async function search() {
  const name = queryInput.value.trim();
  if (!name) return;

  searchBtn.disabled = true;
  resultEl.innerHTML = '<span class="label">querying…</span>';
  timingEl.textContent = "";

  const t1 = performance.now();
  try {
    const item = await em.findOne("Item", { name });
    const elapsed = (performance.now() - t1).toFixed(1);

    if (!item) {
      resultEl.innerHTML = `<span class="error">No item named "${name}"</span>`;
    } else {
      resultEl.innerHTML = [
        `<span class="name">${item.name}</span>`,
        ``,
        `<span class="label">id          </span><span class="value">${item.id}</span>`,
        `<span class="label">image       </span><span class="value">${item.image}</span>`,
        `<span class="label">autosell    </span><span class="value">${item.autosell} meat</span>`,
        `<span class="label">uses        </span><span class="value">${item.uses.join(", ") || "—"}</span>`,
        `<span class="label">tradeable   </span><span class="value">${item.tradeable}</span>`,
        `<span class="label">discardable </span><span class="value">${item.discardable}</span>`,
        `<span class="label">quest       </span><span class="value">${item.quest}</span>`,
        item.plural ? `<span class="label">plural      </span><span class="value">${item.plural}</span>` : null,
      ].filter(Boolean).join("\n");
    }

    timingEl.textContent = `query: ${elapsed}ms`;
  } catch (err) {
    resultEl.innerHTML = `<span class="error">${err}</span>`;
  } finally {
    searchBtn.disabled = false;
  }
}

searchBtn.addEventListener("click", search);
queryInput.addEventListener("keydown", (e) => { if (e.key === "Enter") search(); });

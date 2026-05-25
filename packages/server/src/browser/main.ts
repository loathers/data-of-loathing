import { createClient } from "data-of-loathing";

const statusEl = document.getElementById("status")!;
const lastUpdatedEl = document.getElementById("last-updated")!;
const tableListEl = document.getElementById("table-list")!;
const tableNameEl = document.getElementById("table-name")!;
const tableHeaderEl = document.getElementById("table-header")!;
const tableBodyEl = document.getElementById("table-body")!;
const paginationEl = document.getElementById("pagination")!;
const filterIndicatorEl = document.getElementById("filter-indicator")!;
const filterTextEl = document.getElementById("filter-text")!;
const filterClearEl = document.getElementById("filter-clear")!;
const sqlInputEl = document.getElementById("sql-input") as HTMLTextAreaElement;
const sqlRunEl = document.getElementById("sql-run")!;
const sqlResultEl = document.getElementById("sql-result")!;
const jsonOverlayEl = document.getElementById("json-overlay")!;
const jsonContentEl = document.getElementById("json-content")!.querySelector("pre")!;
const jsonCloseEl = document.getElementById("json-close")!;

// ---- JSON helpers -----------------------------------------------------------

const jsonStore = new Map<string, unknown>();

function tryParseJson(value: unknown): unknown | null {
  if (typeof value !== "string") return null;
  const t = value.trim();
  if (t[0] !== "{" && t[0] !== "[") return null;
  try {
    return JSON.parse(t);
  } catch {
    return null;
  }
}

function jsonPreview(value: unknown): string {
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    if (typeof value[0] === "string") {
      const joined = (value as string[]).join(", ");
      return joined.length > 55 ? joined.slice(0, 52) + "…" : joined;
    }
    if (
      value[0] !== null &&
      typeof value[0] === "object" &&
      "name" in value[0] &&
      "value" in value[0]
    ) {
      const first = value[0] as { name: unknown; value: unknown };
      const label = `${first.name}: ${first.value}`;
      return value.length === 1 ? label : `${label}  +${value.length - 1} more`;
    }
    return `[${value.length} item${value.length !== 1 ? "s" : ""}]`;
  }
  if (typeof value === "object" && value !== null) {
    const keys = Object.keys(value as object);
    if (keys.length === 0) return "{}";
    const pairs = keys
      .slice(0, 2)
      .map((k) => `${k}: ${(value as Record<string, unknown>)[k]}`);
    return keys.length > 2 ? `{${pairs.join(", ")}, …}` : `{${pairs.join(", ")}}`;
  }
  return String(value);
}

function highlightJson(json: string): string {
  return json
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(
      /("(?:\\u[0-9a-fA-F]{4}|\\[^u]|[^\\"])*"(?:\s*:)?|\b(?:true|false)\b|\bnull\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
      (m) => {
        const cls = /^"/.test(m)
          ? /:$/.test(m)
            ? "jk"
            : "js"
          : /true|false/.test(m)
            ? "jb"
            : /null/.test(m)
              ? "jx"
              : "jn";
        return `<span class="${cls}">${m}</span>`;
      },
    );
}

function showJson(data: unknown) {
  jsonContentEl.innerHTML = highlightJson(JSON.stringify(data, null, 2));
  jsonOverlayEl.style.display = "flex";
}

function hideJson() {
  jsonOverlayEl.style.display = "none";
}

jsonCloseEl.addEventListener("click", hideJson);
jsonOverlayEl.addEventListener("click", (e) => {
  if (e.target === jsonOverlayEl) hideJson();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") hideJson();
});

document.addEventListener("click", (e) => {
  const badge = (e.target as Element).closest(".json-badge") as HTMLElement | null;
  if (!badge) return;
  const key = badge.dataset.jsonKey;
  if (key) {
    const data = jsonStore.get(key);
    if (data !== undefined) showJson(data);
  }
});

// ---- Table rendering --------------------------------------------------------

type FKInfo = { table: string; to: string };

function buildRows(
  rows: Record<string, unknown>[],
  cols: string[],
  into: HTMLElement,
  keyPrefix: string,
  fks: Map<string, FKInfo>,
  onFkClick: (fk: FKInfo, value: unknown) => void,
) {
  into.innerHTML = "";
  rows.forEach((row, rowIdx) => {
    const tr = document.createElement("tr");
    cols.forEach((col) => {
      const td = document.createElement("td");
      const raw = row[col];

      if (raw != null && fks.has(col)) {
        const fk = fks.get(col)!;
        const badge = document.createElement("span");
        badge.className = "fk-badge";
        badge.textContent = String(raw);
        badge.title = `→ ${fk.table}.${fk.to}`;
        badge.addEventListener("click", () => onFkClick(fk, raw));
        td.appendChild(badge);
      } else {
        const parsed = tryParseJson(raw);
        if (parsed !== null) {
          const key = `${keyPrefix}-${rowIdx}-${col}`;
          jsonStore.set(key, parsed);
          const badge = document.createElement("span");
          badge.className = "json-badge";
          badge.dataset.jsonKey = key;
          badge.textContent = jsonPreview(parsed);
          td.appendChild(badge);
        } else {
          const text = raw == null ? "" : String(raw);
          td.textContent = text;
          if (text.length > 60) td.title = text;
        }
      }

      tr.appendChild(td);
    });
    into.appendChild(tr);
  });
}

// ---- App --------------------------------------------------------------------

const PAGE_SIZE = 50;
let currentTable = "";
let currentPage = 0;
let currentFilter: { column: string; value: unknown } | null = null;
let currentFKs = new Map<string, FKInfo>();

const client = createClient({ strategy: "opfs", url: "/dol.sqlite" });

try {
  await client.load();
  statusEl.textContent = "";
  const conn = client.query.getConnection();

  async function query(sql: string, params: unknown[] = []): Promise<Record<string, unknown>[]> {
    return conn.execute(sql, params as never[], "all");
  }

  const [meta] = await query("SELECT last_update FROM meta WHERE id = 1");
  if (meta?.last_update) {
    lastUpdatedEl.textContent = `updated ${new Date(meta.last_update as string).toLocaleString()}`;
  }

  const tables = await query(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
  );

  for (const { name } of tables) {
    const btn = document.createElement("button");
    btn.className = "table-btn";
    btn.textContent = name as string;
    btn.addEventListener("click", () => selectTable(name as string));
    tableListEl.appendChild(btn);
  }

  async function selectTable(
    name: string,
    filter?: { column: string; value: unknown },
  ) {
    currentTable = name;
    currentPage = 0;
    currentFilter = filter ?? null;

    document.querySelectorAll(".table-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.textContent === name);
    });

    const fkRows = await query(`PRAGMA foreign_key_list("${name}")`);
    currentFKs = new Map(
      fkRows.map((r) => [
        r.from as string,
        { table: r.table as string, to: r.to as string },
      ]),
    );

    await renderTable();
  }

  function updateFilterIndicator() {
    if (currentFilter) {
      filterTextEl.textContent = `${currentFilter.column} = ${currentFilter.value}`;
      filterIndicatorEl.classList.add("visible");
    } else {
      filterIndicatorEl.classList.remove("visible");
    }
  }

  filterClearEl.addEventListener("click", () => {
    currentFilter = null;
    currentPage = 0;
    renderTable();
  });

  async function renderTable() {
    updateFilterIndicator();

    const where = currentFilter ? `WHERE "${currentFilter.column}" = ?` : "";
    const params = currentFilter ? [currentFilter.value] : [];
    const offset = currentPage * PAGE_SIZE;

    const [rows, [countRow]] = await Promise.all([
      query(
        `SELECT * FROM "${currentTable}" ${where} LIMIT ${PAGE_SIZE} OFFSET ${offset}`,
        params,
      ),
      query(`SELECT COUNT(*) AS total FROM "${currentTable}" ${where}`, params),
    ]);

    const total = Number(countRow?.total ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    tableNameEl.textContent = `${currentTable} (${total.toLocaleString()} rows)`;

    if (rows.length === 0) {
      tableHeaderEl.innerHTML = "";
      tableBodyEl.innerHTML = '<tr><td class="muted" style="padding:12px">No rows</td></tr>';
    } else {
      const cols = Object.keys(rows[0]);
      tableHeaderEl.innerHTML = `<tr>${cols.map((c) => `<th>${c}</th>`).join("")}</tr>`;
      buildRows(rows, cols, tableBodyEl, `t-${currentPage}`, currentFKs, (fk, value) => {
        selectTable(fk.table, { column: fk.to, value });
      });
    }

    paginationEl.innerHTML = `
      <button id="prev-btn" ${currentPage === 0 ? "disabled" : ""}>◀ prev</button>
      <span>page ${currentPage + 1} / ${totalPages}</span>
      <button id="next-btn" ${currentPage >= totalPages - 1 ? "disabled" : ""}>next ▶</button>
    `;
    document.getElementById("prev-btn")?.addEventListener("click", () => {
      currentPage--;
      renderTable();
    });
    document.getElementById("next-btn")?.addEventListener("click", () => {
      currentPage++;
      renderTable();
    });
  }

  if (tables.length > 0) await selectTable(tables[0].name as string);

  sqlRunEl.addEventListener("click", async () => {
    const sql = sqlInputEl.value.trim();
    if (!sql.toLowerCase().startsWith("select")) {
      sqlResultEl.innerHTML = '<p class="error">Only SELECT queries are allowed.</p>';
      return;
    }
    try {
      const rows = await query(sql);
      if (rows.length === 0) {
        sqlResultEl.innerHTML = '<p class="muted">No results.</p>';
        return;
      }
      const cols = Object.keys(rows[0]);
      const thead = cols.map((c) => `<th>${c}</th>`).join("");
      const table = document.createElement("table");
      table.innerHTML = `<thead><tr>${thead}</tr></thead><tbody></tbody>`;
      buildRows(rows, cols, table.querySelector("tbody")!, "q", new Map(), () => {});
      sqlResultEl.innerHTML = "";
      sqlResultEl.appendChild(table);
    } catch (e) {
      sqlResultEl.innerHTML = `<p class="error">${e}</p>`;
    }
  });

  sqlInputEl.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") sqlRunEl.click();
  });
} catch (e) {
  statusEl.textContent = `Error: ${e}`;
  statusEl.style.color = "#f85149";
}

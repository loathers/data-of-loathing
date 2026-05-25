import { createClient } from "data-of-loathing";

const statusEl = document.getElementById("status")!;
const lastUpdatedEl = document.getElementById("last-updated")!;
const tableListEl = document.getElementById("table-list")!;
const tableNameEl = document.getElementById("table-name")!;
const tableHeaderEl = document.getElementById("table-header")!;
const tableBodyEl = document.getElementById("table-body")!;
const paginationEl = document.getElementById("pagination")!;
const sqlInputEl = document.getElementById("sql-input") as HTMLTextAreaElement;
const sqlRunEl = document.getElementById("sql-run")!;
const sqlResultEl = document.getElementById("sql-result")!;

const PAGE_SIZE = 50;
let currentTable = "";
let currentPage = 0;

const client = createClient({ strategy: "opfs", url: "/dol.sqlite" });

try {
  await client.load();
  statusEl.textContent = "";
  const em = client.query;
  const conn = em.getConnection();

  async function query(sql: string, params: unknown[] = []): Promise<Record<string, unknown>[]> {
    return conn.execute(sql, params as never[], "all");
  }

  // Show last update time from meta table
  const [meta] = await query("SELECT lastUpdate FROM meta WHERE id = 1");
  if (meta?.lastUpdate) {
    lastUpdatedEl.textContent = `updated ${new Date(meta.lastUpdate as string).toLocaleString()}`;
  }

  // Populate table list
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

  async function selectTable(name: string) {
    currentTable = name;
    currentPage = 0;
    document.querySelectorAll(".table-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.textContent === name);
    });
    await renderTable();
  }

  async function renderTable() {
    const offset = currentPage * PAGE_SIZE;
    const [rows, [countRow]] = await Promise.all([
      query(`SELECT * FROM "${currentTable}" LIMIT ${PAGE_SIZE} OFFSET ${offset}`),
      query(`SELECT COUNT(*) AS total FROM "${currentTable}"`),
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
      tableBodyEl.innerHTML = rows
        .map(
          (row) =>
            `<tr>${cols.map((c) => `<td title="${escape(String(row[c] ?? ""))}">${row[c] ?? ""}</td>`).join("")}</tr>`,
        )
        .join("");
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

  if (tables.length > 0) {
    await selectTable(tables[0].name as string);
  }

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
      sqlResultEl.innerHTML = `
        <table>
          <thead><tr>${cols.map((c) => `<th>${c}</th>`).join("")}</tr></thead>
          <tbody>${rows.map((row) => `<tr>${cols.map((c) => `<td>${row[c] ?? ""}</td>`).join("")}</tr>`).join("")}</tbody>
        </table>
      `;
    } catch (e) {
      sqlResultEl.innerHTML = `<p class="error">${e}</p>`;
    }
  });

  sqlInputEl.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      sqlRunEl.click();
    }
  });
} catch (e) {
  statusEl.textContent = `Error: ${e}`;
  statusEl.style.color = "#f85149";
}

function escape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

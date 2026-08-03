import puppeteer from "puppeteer";

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();

const consoleMessages = [];
const errors = [];

page.on("console", (msg) => consoleMessages.push(`[${msg.type()}] ${msg.text()}`));
page.on("pageerror", (err) => errors.push(err.message));
page.on("response", (res) => {
  const url = res.url();
  if (url.includes("dol.sqlite")) {
    console.log(`[${res.status()}] ${res.request().method()} ${url}`);
    console.log("  headers:", JSON.stringify(Object.fromEntries(Object.entries(res.headers()).filter(([k]) => ["etag","content-length","access-control-expose-headers"].includes(k)))));
  } else if (!res.ok()) {
    console.log(`[${res.status()}] ${res.request().method()} ${url}`);
  }
});

await page.goto("http://localhost:5175/", { waitUntil: "networkidle2", timeout: 30000 });

const status = await page.$eval("#status", (el) => el.textContent);
console.log("Status:", status);

if (errors.length) {
  console.log("Page errors:");
  errors.forEach((e) => console.log(" ", e));
}

if (consoleMessages.length) {
  console.log("Console:");
  consoleMessages.forEach((m) => console.log(" ", m));
}

if (!status.startsWith("Ready") && !status.startsWith("Connected")) {
  console.log("Not ready, aborting.");
  await browser.close();
  process.exit(1);
}

await page.$eval("#query", (el) => { el.value = "seal tooth"; });
await page.click("#search");

// wait for search to complete (button re-enables)
await page.waitForFunction(() => !document.getElementById("search").disabled, { timeout: 15000 });

const result = await page.$eval("#result", (el) => el.innerText);
const timing = await page.$eval("#timing", (el) => el.textContent);
console.log("Result:", result);
console.log("Timing:", timing);

await browser.close();

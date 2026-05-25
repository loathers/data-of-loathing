import path from "node:path";
import { fileURLToPath } from "node:url";
import { watch } from "data-of-loathing-etl";
import express from "express";
import cors from "cors";

const SQLITE_PATH = path.resolve(process.env.SQLITE_PATH ?? "./dol.sqlite");
const PUBLIC = path.join(path.dirname(fileURLToPath(import.meta.url)), "../dist/public");

await watch(15);

const app = express();

app.use(
  cors({
    exposedHeaders: [
      "ETag",
      "Content-Range",
      "Accept-Ranges",
      "Content-Length",
    ],
  }),
);

// res.sendFile handles ETag, conditional GET (304), and Range requests automatically
app.get("/dol.sqlite", (_req, res) => {
  res.set("Cache-Control", "public, no-cache");
  res.sendFile(SQLITE_PATH);
});

// OPFS requires cross-origin isolation headers on the page and its subresources.
// Applied after /dol.sqlite so external consumers of the SQLite file are unaffected.
app.use((_req, res, next) => {
  res.set("Cross-Origin-Opener-Policy", "same-origin");
  res.set("Cross-Origin-Embedder-Policy", "credentialless");
  next();
});

app.use(express.static(PUBLIC));

app.listen(process.env.PORT ?? 3000, () => {
  console.log("Server started");
});

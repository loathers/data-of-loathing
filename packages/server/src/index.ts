import path from "node:path";
import { watch } from "data-of-loathing-etl";
import express from "express";
import cors from "cors";

const SQLITE_PATH = path.resolve(
  process.env.SQLITE_PATH ?? "./dol.sqlite",
);

await watch(15);

const app = express();

app.use(cors({ exposedHeaders: ["ETag", "Content-Range", "Accept-Ranges", "Content-Length"] }));

// res.sendFile handles ETag, conditional GET (304), and Range requests automatically
app.get("/dol.sqlite", (_req, res) => {
  res.sendFile(SQLITE_PATH);
});

app.get("/", (_req, res) => {
  res.send("DATA OF LOATHING");
});

app.listen(process.env.PORT ?? 3000, () => {
  console.log("Server started");
});

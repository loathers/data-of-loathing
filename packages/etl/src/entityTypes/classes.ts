import { populateEntity, resolveReference } from "../db.js";
import { loadMafiaEnum } from "../utils.js";

export type ClassType = {
  name: string;
  id: number;
  enumName: string;
  image: string | null;
  primeStatIndex: number;
  path: string | null;
  stun: string | null;
  stomachCapacity: number | null;
  liverCapacity: number | null;
  spleenCapacity: number | null;
};

const defaultClass: Omit<ClassType, "name" | "id" | "enumName"> = {
  image: null,
  primeStatIndex: -1,
  path: null,
  stun: null,
  stomachCapacity: null,
  liverCapacity: null,
  spleenCapacity: null,
};

export async function loadClasses() {
  const raw = await loadMafiaEnum("net.sourceforge.kolmafia.AscensionClass");
  return raw.map((c) => ({ ...defaultClass, ...c }) as ClassType);
}

export async function populateClasses() {
  return populateEntity(
    loadClasses,
    "classes",
    [
      ["id", "INTEGER PRIMARY KEY"],
      ["name", "TEXT NOT NULL"],
      ["enumName", "TEXT NOT NULL"],
      ["image", "TEXT"],
      ["primeStatIndex", "INTEGER NOT NULL"],
      ["path", "INTEGER REFERENCES paths(id)"],
      ["stun", "TEXT"],
      ["stomachCapacity", "INTEGER"],
      ["liverCapacity", "INTEGER"],
      ["spleenCapacity", "INTEGER"],
    ],
    async (clazz) => ({
      ...clazz,
      path: await resolveReference("classes", "paths", "enumName", clazz.path),
    }),
  );
}

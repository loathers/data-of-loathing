import { parse } from "java-parser";
import { EnumCollector } from "./EnumCollector.js";

const MAFIA_BASE = "https://raw.githubusercontent.com/kolmafia/kolmafia/main";

// KoLmafia is moving its source around, newest layout first. Drop the old ones
// once the moves have settled.
export const MAFIA_DATA_DIRS = ["src/main/resources/data", "src/data"];
export const MAFIA_JAVA_DIRS = [
  "src/main/java/kolmafia",
  "src/main/java/net/sourceforge/kolmafia",
  "src/net/sourceforge/kolmafia",
];

async function load(dirs: string[], file: string) {
  for (const dir of dirs) {
    const response = await fetch(`${MAFIA_BASE}/${dir}/${file}`);
    if (response.ok) return await response.text();
    if (response.status !== 404)
      throw new Error(`Failed to fetch ${dir}/${file}: ${response.status}`);
  }
  throw new Error(`Could not find ${file} in any of ${dirs.join(", ")}`);
}

export async function loadMafiaData(fileName: string, stripComments = true) {
  return (await load(MAFIA_DATA_DIRS, `${fileName}.txt`))
    .split("\n")
    .slice(1)
    .filter((r) => !stripComments || (r !== "" && !r.startsWith("#")))
    .map((r) => r.split("\t"));
}

export async function getMafiaDataVersion(fileName: string) {
  const data =
    (await load(MAFIA_DATA_DIRS, `${fileName}.txt`)).split("\n")[0] ?? "0";
  return Number(data);
}

export async function checkVersion(
  name: string,
  filename: string,
  version: number,
) {
  const remoteVersion = await getMafiaDataVersion(filename);
  const equal = remoteVersion === version;
  if (!equal)
    console.error(
      `${name} version mismatch. Supported: ${version}, Remote: ${remoteVersion}`,
    );
  return equal;
}

/**
 * @param className Class name relative to the root kolmafia package
 */
export async function loadMafiaEnum(className: string, enumName?: string) {
  const raw = await load(MAFIA_JAVA_DIRS, `${className}.java`);
  const cst = parse(raw);

  const enumCollector = new EnumCollector(enumName || className);
  enumCollector.visit(cst);
  return enumCollector.parserResult;
}

export const tuple = <T extends unknown[]>(args: [...T]): T => args;

export const notNull = <T>(value: T | null): value is T => value !== null;

export const arrayOf = <T>(items: T | T[]) =>
  Array.isArray(items) ? items : [items];

export const isMemberOfEnum =
  <EnumValue, Enum extends { [s: string]: EnumValue }>(e: Enum) =>
  (token: EnumValue): token is Enum[keyof Enum] =>
    Object.values(e).includes(token as Enum[keyof Enum]);

export const memberOfEnumElse = <
  EnumValue,
  Enum extends { [s: string]: EnumValue },
  Fallback,
>(
  e: Enum,
  fallback: Fallback,
) => {
  const isMember = isMemberOfEnum(e);
  return (token: EnumValue) => (isMember(token) ? token : fallback);
};

export function tokenizeAttributes(attributesString: string) {
  return [
    ...attributesString.matchAll(
      /([A-Za-z]+)(?:: (?:([^"[ ]+)|"([^"]+)"|(\[.*?])))?/g,
    ),
  ].reduce<Record<string, string | boolean>>(
    (acc, [, key, value, quotedValue, computedValue]) => ({
      ...acc,
      [key]: value ?? quotedValue ?? computedValue ?? true,
    }),
    {},
  );
}

export function zip<A, B>(a1: A[], a2: B[]): [A, B][];
export function zip<A, B, C>(a1: A[], a2: B[], a3: C[]): [A, B, C][];
export function zip(...arrays: unknown[][]) {
  const maxLength = Math.max(...arrays.map((x) => x.length));
  return Array.from({ length: maxLength }).map((_, i) =>
    Array.from({ length: arrays.length }, (_, k) => arrays[k][i]),
  );
}

/**
 * Parse the sort of range that KoLmafia encodes as a string
 * @param range KoLmafia-style range string
 * @returns Tuple of integers representing range
 */
export function getRange(range: string): [number, number] {
  const [lower, upper] = range
    .match(/^(-?\d+)(?:-(-?\d+))?$/)
    ?.slice(1, 3)
    .map((v) => parseInt(v)) ?? [0];
  return [lower, Number.isNaN(upper) || upper === undefined ? lower : upper];
}

/**
 * Determine the average value from the sort of range that KoLmafia encodes as a string
 *
 * @param range KoLmafia-style range string
 * @returns Average value for range
 */
export function getAverage(range: string): number {
  const [min, max] = getRange(range);
  return (min + max) / 2;
}

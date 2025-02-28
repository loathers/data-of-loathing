import { parse } from "java-parser";
import { EnumCollector } from "./EnumCollector.js";

const MAFIA_BASE =
  "https://raw.githubusercontent.com/kolmafia/kolmafia/main/src";

async function noSizeChange(url: string, lastKnownSize: number) {
  if (lastKnownSize <= 0) return false;
  const sizeCheck = await fetch(url, { method: "HEAD" });
  const newSize = Number(sizeCheck.headers.get("Content-Length") ?? 1);
  if (newSize === lastKnownSize) return true;
}

async function load<T>(
  url: string,
  lastKnownSize: number,
  processRaw: (raw: string) => T,
) {
  if (await noSizeChange(url, lastKnownSize)) return null;
  const request = await fetch(url);
  const raw = await request.text();

  return {
    data: processRaw(raw),
    size: Number(request.headers.get("Content-Length")),
  };
}

export async function loadMafiaData(fileName: string, lastKnownSize = 0) {
  const url = `${MAFIA_BASE}/data/${fileName}.txt`;

  return await load(url, lastKnownSize, (raw) =>
    raw
      .split("\n")
      .slice(1)
      .filter((r) => r !== "" && !r.startsWith("#"))
      .map((r) => r.split("\t")),
  );
}

export async function getMafiaDataVersion(fileName: string) {
  const url = `${MAFIA_BASE}/data/${fileName}.txt`;
  const { data } = (await load(url, 0, (raw) => raw.split("\n")[0])) ?? {
    data: "0",
  };
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

export async function loadMafiaEnum(
  module: string,
  lastKnownSize = 0,
  enumName?: string,
) {
  const pieces = module.split(".");
  const url = `${MAFIA_BASE}/${pieces.join("/")}.java`;

  return await load(url, lastKnownSize, (raw) => {
    const cst = parse(raw);

    const enumCollector = new EnumCollector(
      enumName || pieces[pieces.length - 1],
    );
    enumCollector.visit(cst);
    return enumCollector.parserResult;
  });
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
  ].reduce(
    (acc, [, key, value, quotedValue, computedValue]) => ({
      ...acc,
      [key]: value ?? quotedValue ?? computedValue ?? true,
    }),
    {} as Record<string, string | boolean>,
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

import { parse } from "java-parser";
import { EnumCollector } from "./EnumCollector";

const MAFIA_RAW_BASE =
  "https://raw.githubusercontent.com/kolmafia/kolmafia/main/src";

const MAFIA_DATA_BASE = `${MAFIA_RAW_BASE}/data`;

type MafiaData = { data: string[][]; size: number };
export async function loadMafiaData(
  fileName: string,
  lastKnownSize = 0,
): Promise<MafiaData | null> {
  const url = `${MAFIA_DATA_BASE}/${fileName}.txt`;
  if (lastKnownSize > 0) {
    const sizeCheck = await fetch(url, { method: "HEAD" });
    const newSize = Number(sizeCheck.headers.get("Content-Length") ?? 1);
    if (newSize === lastKnownSize) return null;
  }

  const request = await fetch(url);
  const raw = await request.text();

  return {
    data: raw
      .split("\n")
      .slice(1)
      .filter((r) => r !== "" && !r.startsWith("#"))
      .map((r) => r.split("\t")),
    size: Number(request.headers.get("Content-Length")),
  };
}

export async function loadMafiaEnum(module: string, enumName?: string) {
  const pieces = module.split(".");
  const url = `${MAFIA_RAW_BASE}/${pieces.join("/")}.java`;
  if (!enumName) enumName = pieces[pieces.length - 1];

  const request = await fetch(url);
  const raw = await request.text();

  const cst = parse(raw);

  const enumCollector = new EnumCollector(enumName);
  enumCollector.visit(cst);
  return enumCollector.parserResult;
}

export const tuple = <T extends unknown[]>(args: [...T]): T => args;

export const arrayOf = <T>(items: T | T[]) =>
  Array.isArray(items) ? items : [items];

export const isMemberOfEnum =
  <EnumValue, Enum extends { [s: string]: EnumValue }>(e: Enum) =>
  (token: EnumValue): token is Enum[keyof Enum] =>
    Object.values(e).includes(token as Enum[keyof Enum]);

export function zip<A, B>(a1: A[], a2: B[]): [A, B][];
export function zip<A, B, C>(a1: A[], a2: B[], a3: C[]): [A, B, C][];
export function zip(...arrays: unknown[][]) {
  const maxLength = Math.max(...arrays.map((x) => x.length));
  return Array.from({ length: maxLength }).map((_, i) =>
    Array.from({ length: arrays.length }, (_, k) => arrays[k][i]),
  );
}

import { parse } from "java-parser";
import { EnumCollector } from "./EnumCollector";

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

export function zip<A, B>(a1: A[], a2: B[]): [A, B][];
export function zip<A, B, C>(a1: A[], a2: B[], a3: C[]): [A, B, C][];
export function zip(...arrays: unknown[][]) {
  const maxLength = Math.max(...arrays.map((x) => x.length));
  return Array.from({ length: maxLength }).map((_, i) =>
    Array.from({ length: arrays.length }, (_, k) => arrays[k][i]),
  );
}

type Entity = { id: number; name: string };

const sortEntities = (a: Entity, b: Entity) => {
  if (a.name > b.name) return -1;
  if (b.name > a.name) return 1;
  return 0;
};

export function disambiguate(entities: Entity[]) {
  entities.sort(sortEntities);

  const names = [];
  let disam = false;

  for (let i = 1; i <= entities.length; i++) {
    const last = entities[i - 1];
    const current = entities[i];

    if (last.name === current?.name || disam) {
      names.push(`[${last.id}]${last.name}`);
      disam = last.name === current?.name;
    } else {
      names.push(last.name);
    }
  }

  return names;
}

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

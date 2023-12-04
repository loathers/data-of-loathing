import { expect } from "vitest";

export function createFetchResponse(data: string) {
  return {
    json: () => new Promise((resolve) => resolve(JSON.parse(data))),
    text: () => new Promise((resolve) => resolve(data)),
    headers: new Headers({ "Content-Length": String(data.length) }),
  } as Response;
}

export function expectNotNull<T>(val?: T): asserts val is NonNullable<T> {
  expect(val).toBeDefined();
}
